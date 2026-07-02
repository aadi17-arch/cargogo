import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBooking } from '@/hooks/useBooking';
import { useDriverStatus } from '@/hooks/useDriverStatus';
import { useSocket, useSocketListener } from '@/hooks/useSocket';
import { driverService } from '@/services/driver.service';
import { geocodingService } from '@/services/geocoding.service';
import { VrpRouteResponse } from '@/types/driver.types';
import { toast } from 'react-hot-toast';
import { LocateFixed, Navigation, Clock, FileText } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import MapView, { MapMarker } from '@/components/map/MapView';
import TabNavigation from '@/components/ui/TabNavigation';
import EmptyState from '@/components/ui/EmptyState';
import { formatPrice, formatDate } from '@/utils/formatters';
import L from 'leaflet';

function DriverDashboard() {
  const { token } = useAuth();
  const { bookings, fetchMyBookings, fetchPendingBookings, acceptBooking: apiAcceptBooking } = useBooking();
  const { isOnline, updateStatus } = useDriverStatus();
  const { acceptBid: socketAcceptBid, rejectBid: socketRejectBid } = useSocket(token);

  const [bid, setBid] = useState<any>(null);
  const [countdown, setCountdown] = useState(30);
  const [earnings, setEarnings] = useState(0);
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'my_jobs' | 'jobs_board' | 'past_jobs'>('my_jobs');
  const [routeData, setRouteData] = useState<VrpRouteResponse | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [driverCoords, setDriverCoords] = useState<[number, number] | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [addressCache, setAddressCache] = useState<{ [key: string]: string }>({});
  const [driverLocationName, setDriverLocationName] = useState<string>('Detecting...');
  const lastGeocodedCoords = useRef<[number, number] | null>(null);
  const navigate = useNavigate();

  const resolveDriverAddress = async (lat: number, lng: number) => {
    try {
      const data = await geocodingService.reverse(lat, lng);
      if (data?.display_name) setDriverLocationName(data.display_name.split(',')[0] || 'Mumbai');
    } catch (e) { console.error(e); }
  };

  const resolveAddresses = async (stops: any[]) => {
    const newAddresses = { ...addressCache };
    let updated = false;
    for (const stop of stops) {
      const key = `${stop.location.lat.toFixed(4)},${stop.location.lng.toFixed(4)}`;
      if (!newAddresses[key]) {
        try {
          const data = await geocodingService.reverse(stop.location.lat, stop.location.lng);
          if (data?.display_name) { newAddresses[key] = data.display_name.split(',')[0] || 'Unknown Location'; updated = true; }
        } catch (e) { console.error(e); }
      }
    }
    if (updated) setAddressCache(newAddresses);
  };

  useEffect(() => {
    if (!driverCoords) return;
    const [lat, lng] = driverCoords;
    if (!lastGeocodedCoords.current ||
        Math.abs(lastGeocodedCoords.current[0] - lat) > 0.001 ||
        Math.abs(lastGeocodedCoords.current[1] - lng) > 0.001) {
      lastGeocodedCoords.current = [lat, lng];
      resolveDriverAddress(lat, lng);
    }
  }, [driverCoords]);

  useEffect(() => {
    if (routeData?.route) resolveAddresses(routeData.route);
  }, [routeData]);

  const loadData = async () => {
    await fetchMyBookings();
    try {
      const pending = await fetchPendingBookings();
      setPendingBookings(pending || []);
    } catch (err) { console.error(err); }
    fetchRoute();
  };

  const fetchRoute = async () => {
    let lat: number | undefined;
    let lng: number | undefined;
    setLoadingRoute(true);
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        lat = position.coords.latitude;
        lng = position.coords.longitude;
        setDriverCoords([lat, lng]);
      } catch (e) { console.warn('Geolocation failed:', e); }
    }
    if (!lat || !lng) {
      lat = 19.0760; lng = 72.8777;
      setDriverCoords([lat, lng]);
    }
    try {
      const data = await driverService.getOptimizedRoute(lat, lng);
      setRouteData(data);
    } catch (e) { console.error('Failed to fetch optimized route:', e); }
    finally { setLoadingRoute(false); }
  };

  useEffect(() => { if (token) loadData(); }, [token]);

  useSocketListener('incoming-bid', (data: any) => { setBid(data); setCountdown(30); });
  useSocketListener('bid-accepted', () => { toast.success('Bid accepted! Go to pickup.'); setBid(null); loadData(); });
  useSocketListener('driver:location:update', (data: any) => { if (data?.lat && data?.lng) setDriverCoords([data.lat, data.lng]); });
  useSocketListener('driver:arrived', () => loadData());
  useSocketListener('trip:completed', () => loadData());
  useSocketListener('booking-cancelled', () => loadData());

  useEffect(() => {
    const total = bookings
      .filter((b: any) => b.status === 'DELIVERED' || b.status === 'COMPLETED')
      .reduce((sum: number, b: any) => sum + b.price, 0);
    setEarnings(total);
  }, [bookings]);

  useEffect(() => {
    if (!bid) return;
    const timer = setInterval(() => {
      setCountdown((c) => { if (c <= 1) { setBid(null); return 0; } return c - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [bid]);

  const toggleOnline = async () => {
    try {
      if (!isOnline) {
        navigator.geolocation.getCurrentPosition(
          async (position) => { const { latitude, longitude } = position.coords; await updateStatus('ONLINE', latitude, longitude); },
          (e) => toast.error('Location access is required to go online: ' + e.message)
        );
      } else {
        await updateStatus('OFFLINE', 0, 0);
      }
    } catch (err: any) { toast.error(err.message || 'Failed to update status'); }
  };

  const handleAcceptBid = () => {
    try { socketAcceptBid(bid.bookingId); setBid(null); }
    catch (err: any) { toast.error('Error accepting bid: ' + err.message); }
  };

  const handleRejectBid = () => {
    try { socketRejectBid(bid.bookingId); setBid(null); }
    catch (err: any) { toast.error('Error rejecting bid: ' + err.message); }
  };

  const handleAcceptPending = async (bookingId: string) => {
    try { await apiAcceptBooking(bookingId); setActiveTab('my_jobs'); await loadData(); }
    catch (err: any) { toast.error(err.message || 'Failed to accept shipment'); }
  };

  const activeBookings = bookings.filter((b: any) => !['COMPLETED', 'CANCELLED', 'DELIVERED'].includes(b.status));
  const pastBookings   = bookings.filter((b: any) => ['COMPLETED', 'CANCELLED', 'DELIVERED'].includes(b.status));

  // Build standard Map markers listing
  const mapCenter: [number, number] = driverCoords 
    ? driverCoords 
    : (routeData?.route && routeData.route.length > 0)
      ? [routeData.route[0].location.lat, routeData.route[0].location.lng]
      : [19.0760, 72.8777];

  const mapMarkers = useMemo(() => {
    const list: MapMarker[] = [];
    if (driverCoords) {
      list.push({ lat: driverCoords[0], lng: driverCoords[1], popupText: 'Your Location (Driver)', isDriver: true });
    }
    if (routeData?.route) {
      routeData.route.forEach((stop: any, idx: number) => {
        list.push({
          lat: stop.location.lat,
          lng: stop.location.lng,
          popupText: `Stop ${idx + 1}: ${stop.type === 'PICKUP' ? 'Pickup' : 'Dropoff'} (${stop.cargoType})`
        });
      });
    }
    return list;
  }, [driverCoords, routeData]);

  const routePolyline = useMemo(() => {
    const positions: [number, number][] = [];
    if (driverCoords) positions.push(driverCoords);
    if (routeData?.route) {
      routeData.route.forEach((stop: any) => {
        positions.push([stop.location.lat, stop.location.lng]);
      });
    }
    return positions;
  }, [driverCoords, routeData]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight text-slate-800 font-heading">
        Driver Dashboard
      </h2>

      {/* Online status switch card */}
      <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1 font-body">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-500">Service Mode:</span>
            <span className={`text-sm font-black uppercase ${isOnline ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Location: <span className="font-semibold text-slate-700">{driverLocationName}</span>
          </p>
          <p className="text-xs text-slate-400">
            Earnings: <span className="font-bold text-emerald-600 font-mono">{formatPrice(earnings)}</span>
          </p>
        </div>
        <button
          onClick={toggleOnline}
          className={`w-full md:w-auto px-6 py-2.5 text-xs font-bold text-white rounded-xl transition-all shadow-sm ${
            isOnline 
              ? 'bg-rose-600 hover:bg-rose-500' 
              : 'bg-slate-900 hover:bg-slate-800'
          }`}
        >
          {isOnline ? 'Go Offline' : 'Go Online'}
        </button>
      </div>

      {/* Incoming bid Alert */}
      {bid && (
        <div className="p-6 bg-indigo-50/50 border border-indigo-600 rounded-xl shadow-md space-y-4 animate-pulse">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
            <h3 className="text-lg font-black text-indigo-700 tracking-tight font-heading">
              New Delivery Request!
            </h3>
            <span className="text-xs font-mono font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
              {countdown}s remaining
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-xs font-body text-indigo-900">
            <div>
              <span className="block text-[10px] font-bold text-indigo-400 uppercase">Cargo</span>
              <span className="font-bold">{bid.cargoType}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-indigo-400 uppercase">Payout</span>
              <span className="font-bold font-mono">{formatPrice(bid.price)}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-indigo-400 uppercase">Distance</span>
              <span className="font-bold">{bid.distanceKm} km</span>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button 
              onClick={handleAcceptBid} 
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 text-xs font-bold rounded-xl transition-colors shadow-sm"
            >
              Accept Order
            </button>
            <button 
              onClick={handleRejectBid} 
              className="flex-1 bg-transparent hover:bg-indigo-100/50 text-indigo-600 border border-indigo-200 py-2.5 text-xs font-bold rounded-xl transition-colors"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <TabNavigation
        tabs={[
          { id: 'my_jobs', label: `My Deliveries (${activeBookings.length})` },
          { id: 'jobs_board', label: `Available Board (${pendingBookings.length})` },
          { id: 'past_jobs', label: `History (${pastBookings.length})` }
        ]}
        activeTab={activeTab}
        onChange={(id) => { setActiveTab(id); if (id === 'jobs_board') loadData(); }}
        className="border-b-0"
      />

      {/* My Deliveries Tab layout */}
      {activeTab === 'my_jobs' && (
        activeBookings.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No active deliveries assigned"
            description="Go online to receive new delivery bids or accept jobs from the available board."
            action={
              <button 
                onClick={() => setActiveTab('jobs_board')} 
                className="text-xs font-bold text-indigo-600 hover:underline bg-transparent border-none outline-none cursor-pointer"
              >
                Accept jobs from available board
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
            {/* Left Column: Timeline details */}
            <div className="lg:col-span-5 space-y-6 w-full order-2 lg:order-1">
              <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4 relative overflow-hidden">
                {loadingRoute && (
                  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-[2px]">
                    <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-3 text-xs font-extrabold text-slate-800 font-heading">Optimizing route...</p>
                  </div>
                )}
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="space-y-0.5">
                    <h3 className="text-base font-bold text-slate-800 font-heading">Route Timeline</h3>
                    <p className="text-[10px] text-slate-400">Optimized stop sequence</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={loadData} className="px-2.5 py-1.5 text-[10px] font-bold bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg shadow-sm">Refresh</button>
                    <button onClick={fetchRoute} disabled={loadingRoute} className="px-2.5 py-1.5 text-[10px] font-bold bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg shadow-sm disabled:opacity-50">
                      Re-plan
                    </button>
                  </div>
                </div>

                {routeData && routeData.route.length > 0 ? (
                  <div className="space-y-4">
                    <div className="relative border-l border-slate-100 ml-3 pl-6 space-y-5">
                      {routeData.route.map((stop: any, index: number) => {
                        const booking = bookings.find((b: any) => b.id === stop.bookingId);
                        const status = booking?.status || 'PENDING';
                        return (
                          <div key={index} className="relative">
                            <span className="absolute -left-[35px] top-3.5 w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center text-[10px] font-bold bg-white text-slate-500">
                              {index + 1}
                            </span>
                            <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex flex-col gap-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className={`text-[8px] font-extrabold tracking-wide uppercase px-1.5 py-0.5 rounded border bg-transparent shrink-0 ${
                                    stop.type === 'PICKUP' 
                                      ? 'border-emerald-600/30 text-emerald-600' 
                                      : 'border-orange-600/30 text-orange-600'
                                  }`}>
                                    {stop.type === 'PICKUP' ? 'Pick' : 'Drop'}
                                  </span>
                                  <span className="text-xs font-bold text-slate-800 truncate font-heading">
                                    {stop.cargoType} {addressCache[`${stop.location.lat.toFixed(4)},${stop.location.lng.toFixed(4)}`] ? `(${addressCache[`${stop.location.lat.toFixed(4)},${stop.location.lng.toFixed(4)}`]})` : ''}
                                  </span>
                                </div>
                                {booking && <StatusBadge status={status} className="text-[8px]" />}
                              </div>
                              <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-slate-200/50 border-dashed">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400">
                                  <span>Payout: <span className="font-bold text-slate-700 font-mono">{formatPrice((booking as any)?.price || booking?.totalPrice || 0)}</span></span>
                                  <span>|</span>
                                  <span>Wt: <span className="font-semibold text-slate-700">{stop.weightKg}kg</span></span>
                                </div>
                                {booking && status !== 'CANCELLED' && (
                                  <button onClick={() => navigate(`/track/${booking.id}`)} className="bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1 text-[9px] font-bold rounded shadow-sm shrink-0">
                                    {['DELIVERED', 'COMPLETED'].includes(status) ? 'Details' : 'Track'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {activeBookings.map((b: any) => (
                      <div key={b.id} className="py-3 flex justify-between items-center text-xs font-body">
                        <div>
                          <p className="font-bold text-slate-800">{b.cargoType}</p>
                          <p className="text-slate-400">Payout: {formatPrice(b.price)} | Status: {b.status}</p>
                        </div>
                        <button onClick={() => navigate(`/track/${b.id}`)} className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1 font-bold rounded-lg shadow-sm">
                          Track
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Route Map */}
            <div className="lg:col-span-7 lg:sticky lg:top-20 w-full order-1 lg:order-2 space-y-4">
              {routeData && routeData.route.length > 0 && (
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-base font-bold text-slate-800 font-heading">Optimized Navigation Route</h3>
                    <p className="text-[10px] text-slate-400">
                      Distance: <span className="font-bold text-slate-700">{routeData.totalDistanceKm} km</span> | Max Payload: {routeData.vehicleCapacityKg} kg
                    </p>
                  </div>
                  <div className="h-80 sm:h-[400px] w-full overflow-hidden border border-slate-200 rounded-xl shadow-sm relative">
                    <MapView 
                      center={mapCenter} 
                      zoom={11} 
                      markers={mapMarkers} 
                      routePositions={routePolyline} 
                      polylineColor="indigo"
                      setMap={setMap}
                    />
                    {driverCoords && map && (
                      <button
                        onClick={() => map.setView(driverCoords, map.getZoom(), { animate: true })}
                        className="absolute top-3 right-3 z-[1000] flex items-center justify-center bg-white hover:bg-slate-50 border border-slate-200 shadow-md rounded-lg p-2 transition cursor-pointer"
                        title="Focus current location"
                        style={{ width: '34px', height: '34px' }}
                      >
                        <LocateFixed size={16} className="text-slate-700" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      )}

      {/* Available Deliveries Board */}
      {activeTab === 'jobs_board' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 font-heading">Available Board</h3>
            <button onClick={loadData} className="px-3.5 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors shadow-sm">
              Refresh
            </button>
          </div>
          {pendingBookings.length > 0 ? (
            <div className="divide-y divide-slate-100 text-xs">
              {pendingBookings.map((b: any) => (
                <div key={b.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 font-body">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800 text-sm font-heading">{b.cargoType}</p>
                    <p className="text-slate-400">
                      Payout: <span className="font-bold text-indigo-600 font-mono">{formatPrice(b.price)}</span> | Distance: <span className="font-semibold text-slate-700">{b.distanceKm} km</span>
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">Received: {formatDate(b.createdAt)}</p>
                  </div>
                  <button 
                    onClick={() => handleAcceptPending(b.id)} 
                    className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 font-bold rounded-lg shadow-sm shrink-0"
                  >
                    Accept Cargo
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Navigation}
              title="No shipments matching vehicle specs currently pending"
              description="New delivery requests will appear on the board automatically. Keep refreshing to get updates."
              action={
                <button 
                  onClick={loadData} 
                  className="text-xs font-bold text-indigo-600 hover:underline bg-transparent border-none outline-none cursor-pointer"
                >
                  Refresh Available Board
                </button>
              }
            />
          )}
        </div>
      )}

      {/* Past Deliveries history */}
      {activeTab === 'past_jobs' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 font-heading">Past Manifests</h3>
          {pastBookings.length > 0 ? (
            <div className="divide-y divide-slate-100 text-xs">
              {pastBookings.map((b: any) => (
                <div key={b.id} className="py-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 font-body">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm font-heading">{b.cargoType}</span>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="text-slate-400">
                      Payout: <span className="font-bold text-emerald-600 font-mono">{formatPrice(b.price)}</span>
                    </p>
                    {b.pickupAddress && b.dropoffAddress && (
                      <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-normal max-w-xl">
                        <strong>Route:</strong> {b.pickupAddress} → {b.dropoffAddress}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400 font-mono">{formatDate(b.createdAt)}</p>
                  </div>
                  <button 
                    onClick={() => navigate(`/track/${b.id}`)} 
                    className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 font-bold rounded-lg shadow-sm shrink-0"
                  >
                    Details
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No past shipments found"
              description="Your completed or cancelled cargo deliveries will be listed here in your history."
            />
          )}
        </div>
      )}
    </div>
  );
}

export default DriverDashboard;
