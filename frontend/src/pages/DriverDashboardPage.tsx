import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBooking } from '@/hooks/useBooking';
import { useDriverStatus } from '@/hooks/useDriverStatus';
import { useSocket, useSocketListener } from '@/hooks/useSocket';
import { driverService } from '@/services/driver.service';
import { bookingService } from '@/services/booking.service';
import { VrpRouteResponse } from '@/types/driver.types';
import { ScheduledJob } from '@/types/booking.types';
import { toast } from 'react-hot-toast';
import { LocateFixed, Navigation, Clock, FileText, CalendarClock, Briefcase, RefreshCw } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import MapView, { MapMarker } from '@/components/map/MapView';
import EmptyState from '@/components/ui/EmptyState';
import DashboardHeader from '@/components/ui/DashboardHeader';
import MapOverlayCard from '@/components/ui/MapOverlayCard';
import LocateButton from '@/components/ui/LocateButton';
import { useAddressResolver } from '@/hooks/useAddressResolver';
import { formatDate } from '@/utils/formatters';
import L from 'leaflet';

function DriverDashboard() {
  const { token } = useAuth();
  const { bookings, fetchMyBookings, fetchPendingBookings, acceptBooking: apiAcceptBooking } = useBooking();
  const { isOnline, updateStatus } = useDriverStatus();
  const { acceptBid: socketAcceptBid, rejectBid: socketRejectBid } = useSocket(token);

  const [bid, setBid] = useState<any>(null);
  const [countdown, setCountdown] = useState(30);
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'my_jobs' | 'jobs_board' | 'schedule' | 'past_jobs'>('my_jobs');
  const [routeData, setRouteData] = useState<VrpRouteResponse | null>(null);
  const [, setLoadingRoute] = useState(false);
  const [driverCoords, setDriverCoords] = useState<[number, number] | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [driverLocationName, setDriverLocationName] = useState<string>('Detecting...');
  const lastGeocodedCoords = useRef<[number, number] | null>(null);
  const navigate = useNavigate();
  const { commitScheduledJob: socketCommitScheduledJob } = useSocket(token);

  const { resolveAddresses, resolveSingleAddress } = useAddressResolver();

  
  const [scheduledJobs, setScheduledJobs] = useState<ScheduledJob[]>([]);
  const [availableScheduledJobs, setAvailableScheduledJobs] = useState<ScheduledJob[]>([]);
  const [showScheduledBoard, setShowScheduledBoard] = useState(false);
  const [committingJobId, setCommittingJobId] = useState<string | null>(null);
  const [loadingScheduled, setLoadingScheduled] = useState(false);

  const resolveDriverAddress = async (lat: number, lng: number) => {
    const name = await resolveSingleAddress(lat, lng);
    setDriverLocationName(name);
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
    loadScheduledJobs();
    fetchRoute();
  };

  
  const loadScheduledJobs = useCallback(async () => {
    setLoadingScheduled(true);
    try {
      const [upcoming, available] = await Promise.all([
        bookingService.getScheduledJobs(),
        bookingService.getAvailableScheduledJobs(),
      ]);
      setScheduledJobs(upcoming as ScheduledJob[]);
      setAvailableScheduledJobs(available as ScheduledJob[]);
    } catch (err) {
      console.error('Failed to load scheduled jobs:', err);
    } finally { setLoadingScheduled(false); }
  }, []);

  
  const handleCommitScheduledJob = async (bookingId: string) => {
    setCommittingJobId(bookingId);
    try {
      socketCommitScheduledJob(bookingId);
    } catch (err: any) {
      toast.error('Failed to commit to job: ' + err.message);
    } finally { setCommittingJobId(null); }
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
      setLoadingRoute(false);
      return;
    }
    try {
      const data = await driverService.getOptimizedRoute(lat, lng);
      setRouteData(data);
    } catch (e) { console.error('Failed to fetch optimized route:', e); }
    finally { setLoadingRoute(false); }
  };

  useEffect(() => {
    if (token) {
      loadData();
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setDriverCoords([pos.coords.latitude, pos.coords.longitude]);
          },
          () => {}
        );
      }
    }
  }, [token]);

  useSocketListener('incoming-bid', (data: any) => { setBid(data); setCountdown(30); });
  useSocketListener('bid-accepted', () => { toast.success('Bid accepted! Go to pickup.'); setBid(null); loadData(); });
  useSocketListener('driver:location:update', (data: any) => { if (data?.lat && data?.lng) setDriverCoords([data.lat, data.lng]); });
  useSocketListener('driver:arrived', () => loadData());
  useSocketListener('trip:completed', () => loadData());
  useSocketListener('booking-cancelled', () => loadData());
  
  useSocketListener('scheduled_job_available', (data: any) => {
    toast.success(`📅 New scheduled job: ${data.cargoType} on ${formatDate(data.scheduledAt)}`, { duration: 6000 });
    loadScheduledJobs(); 
  });
  
  useSocketListener('commit-confirmed', (data: any) => {
    toast.success(`✅ Committed! Job scheduled for ${formatDate(data.scheduledAt)}`);
    setCommittingJobId(null);
    loadScheduledJobs();
  });

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
    <div className="relative h-[calc(100vh-64px)] w-full overflow-hidden bg-white flex flex-col">
      <style>{`
        .leaflet-control-attribution { display: none !important; }
        ::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
        * { -ms-overflow-style: none !important; scrollbar-width: none !important; }
      `}</style>

      {}
      <DashboardHeader
        title="Driver Dashboard"
        tabs={[
          { id: 'my_jobs', label: `Jobs (${activeBookings.length})` },
          { id: 'jobs_board', label: `Available (${pendingBookings.length})` },
          { id: 'schedule', label: `Schedule (${scheduledJobs.length})` },
          { id: 'past_jobs', label: `History (${pastBookings.length})` },
        ]}
        activeTab={activeTab}
        onChange={(id) => {
          setActiveTab(id as any);
          if (id === 'jobs_board') loadData();
          if (id === 'schedule') loadScheduledJobs();
        }}
      />

      {activeTab === 'my_jobs' ? (
        
        <div className="flex-1 w-full p-2 sm:p-4 relative flex flex-col min-h-0 overflow-hidden bg-white">
          <div className="relative w-full h-full flex-1 rounded-xl border border-slate-200 shadow-xs overflow-hidden bg-white">

            {}
            <div className="absolute inset-0 z-0 h-full w-full">
              <MapView
                center={mapCenter}
                zoom={driverCoords ? 13 : 5}
                markers={mapMarkers}
                routePositions={routePolyline}
                polylineColor="#0F172A"
                setMap={setMap}
              />
            </div>

            {}
            <div className="absolute top-3 right-3 md:top-4 md:right-4 z-20 flex items-center gap-2">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-md">
                <div className={`w-2 h-2 rounded-sm shrink-0 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <span className="text-xs font-bold text-slate-900 font-heading">{isOnline ? 'Online' : 'Offline'}</span>
                <button
                  onClick={toggleOnline}
                  disabled={isOnline && activeBookings.length > 0}
                  className="text-xs font-bold text-white bg-slate-950 hover:bg-slate-800 rounded-md px-2.5 py-1 transition-all cursor-pointer font-heading disabled:opacity-50"
                >
                  {isOnline ? 'Go Offline' : 'Go Online'}
                </button>
                <div className="w-px h-4 bg-slate-200" />
                <LocateFixed size={11} className="text-slate-400 shrink-0" />
                <span className="text-[11px] font-bold text-slate-700 truncate font-body max-w-[140px]" title={driverLocationName}>{driverLocationName}</span>
              </div>
              <LocateButton
                onClick={() => { if (driverCoords && map) map.setView(driverCoords, 14, { animate: true }); }}
              />
            </div>

            {}
            {bid && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 w-[320px]">
                <div className="bg-white border-2 border-slate-900 rounded-xl shadow-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 font-heading">New Delivery Request!</h3>
                    <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">{countdown}s</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><span className="block text-[10px] font-bold text-slate-500">Cargo</span><span className="font-bold text-slate-900 truncate block">{bid.cargoType}</span></div>
                    <div><span className="block text-[10px] font-bold text-slate-500">Payout</span><span className="font-extrabold text-slate-900">₹{Math.round(bid.price)}</span></div>
                    <div><span className="block text-[10px] font-bold text-slate-500">Distance</span><span className="font-bold text-slate-900">{bid.distanceKm} km</span></div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAcceptBid} className="flex-1 bg-slate-950 hover:bg-slate-800 text-white py-1.5 text-xs font-bold rounded-lg cursor-pointer font-heading">Accept</button>
                    <button onClick={handleRejectBid} className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-1.5 text-xs font-bold rounded-lg cursor-pointer font-heading">Decline</button>
                  </div>
                </div>
              </div>
            )}

            {}
            <MapOverlayCard>
              {activeBookings.length === 0 ? (
                <EmptyState icon={Clock} title="No active jobs" description="Go online to receive deliveries."
                  action={<button onClick={() => { setActiveTab('jobs_board'); loadData(); }} className="text-xs font-bold text-slate-950 hover:underline bg-transparent border-none cursor-pointer">Browse Jobs</button>}
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 font-heading">Active Trips</h3>
                      <p className="text-[11px] text-slate-500">Overview of currently active jobs</p>
                    </div>
                    <button onClick={loadData} className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 bg-white cursor-pointer" title="Refresh">
                      <RefreshCw size={14} />
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {activeBookings.map((b: any) => (
                      <div key={b.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-900 truncate">{b.cargoType}</span>
                          </div>
                          {b.pickupAddress && b.dropoffAddress && (
                            <p className="text-[11px] text-slate-600 truncate mb-1">
                              {b.pickupAddress.split(',')[0]} &rarr; {b.dropoffAddress.split(',')[0]}
                            </p>
                          )}
                          <div className="text-slate-500 flex items-center gap-1.5">
                            <span>₹{Math.round(b.price || b.totalPrice || 0)}</span>
                            <span>&middot;</span>
                            <span>{b.weightKg} kg</span>
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(`/track/${b.id}`)}
                          className="bg-slate-950 hover:bg-slate-800 text-white px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer shrink-0 font-heading"
                        >
                          Track
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </MapOverlayCard>

            {}
            <div className="absolute bottom-3 left-2.5 right-2.5 z-10 flex flex-col gap-2 md:hidden max-h-[56vh]">
              <div className="bg-white rounded-xl border border-slate-200 shadow-md px-3 py-2 flex items-center gap-2 shrink-0">
                <div className={`w-2 h-2 rounded-sm shrink-0 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <span className="text-xs font-bold text-slate-900">{isOnline ? 'Online' : 'Offline'}</span>
                <button onClick={toggleOnline} disabled={isOnline && activeBookings.length > 0} className="ml-auto text-xs font-bold text-white bg-slate-950 rounded-md px-2.5 py-1 cursor-pointer disabled:opacity-50">
                  {isOnline ? 'Go Offline' : 'Go Online'}
                </button>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-y-auto p-3 font-body text-slate-800 space-y-2 flex-1 min-h-0 text-left">
                {activeBookings.length === 0
                  ? <EmptyState icon={Clock} title="No active jobs" description="Go online." action={<button onClick={() => { setActiveTab('jobs_board'); loadData(); }} className="text-xs font-bold text-slate-950 hover:underline bg-transparent border-none cursor-pointer">Browse Jobs</button>} />
                  : <div className="space-y-2 text-xs">
                      {activeBookings.map((b: any) => (
                        <div key={b.id} className="p-2.5 border border-slate-200 rounded-lg flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900 truncate">{b.cargoType}</p>
                            {b.pickupAddress && b.dropoffAddress && (
                              <p className="text-[10px] text-slate-500 truncate">
                                {b.pickupAddress.split(',')[0]} &rarr; {b.dropoffAddress.split(',')[0]}
                              </p>
                            )}
                          </div>
                          <button onClick={() => navigate(`/track/${b.id}`)} className="bg-slate-950 text-white px-2.5 py-1 text-xs font-bold rounded-md shrink-0 cursor-pointer">Track</button>
                        </div>
                      ))}
                    </div>
                }
              </div>
            </div>

          </div>
        </div>
      ) : (
        
        <div className="flex-1 w-full bg-white flex flex-col overflow-y-auto px-6 py-6 space-y-4 text-left">

          {}
          {activeTab === 'jobs_board' && (
            <div className="space-y-4 max-w-4xl mx-auto w-full">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-heading">Available Shipments</h3>
                  <p className="text-xs text-slate-500">New delivery requests nearby</p>
                </div>
                <button onClick={loadData} className="w-8 h-8 flex items-center justify-center border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition bg-white shadow-xs cursor-pointer" title="Refresh">
                  <RefreshCw size={14} />
                </button>
              </div>

              <div className="divide-y divide-slate-100 border-t border-b border-slate-100">
                {pendingBookings.length > 0 ? (
                  pendingBookings.map((b: any) => (
                    <div key={b.id} className="py-4 flex items-center justify-between gap-4 text-xs font-body">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <span className="font-bold text-sm text-slate-900 font-heading">{b.cargoType}</span>
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">#{b.id.slice(0, 8).toUpperCase()}</span>
                        </div>
                        {b.pickupAddress && b.dropoffAddress && (
                          <p className="text-slate-600 mb-1">
                            {b.pickupAddress.split(',')[0]} &rarr; {b.dropoffAddress.split(',')[0]}
                          </p>
                        )}
                        <div className="text-slate-500 flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-700">₹{Math.round(b.price)}</span>
                          <span>&middot;</span>
                          <span>{b.distanceKm} km</span>
                          <span>&middot;</span>
                          <span>{formatDate(b.createdAt)}</span>
                        </div>
                      </div>
                      <button onClick={() => handleAcceptPending(b.id)} className="bg-slate-950 hover:bg-slate-800 text-white px-4 py-2 text-xs font-bold rounded-lg cursor-pointer shrink-0 font-heading">
                        Accept Shipment
                      </button>
                    </div>
                  ))
                ) : (
                  <EmptyState icon={Navigation} title="No shipments available" description="Refresh to check for new load offers." />
                )}
              </div>
            </div>
          )}

          {}
          {(activeTab as string) === 'schedule' && (
            <div className="space-y-4 max-w-4xl mx-auto w-full">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-heading flex items-center gap-2">
                    <CalendarClock size={20} className="text-slate-700" />
                    Scheduled Deliveries
                  </h3>
                  <p className="text-xs text-slate-500">Upcoming bookings assigned to your schedule</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center border border-slate-200 rounded-lg p-1 bg-white shadow-xs">
                    <button onClick={() => setShowScheduledBoard(false)} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${!showScheduledBoard ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Committed</button>
                    <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />
                    <button onClick={() => { setShowScheduledBoard(true); loadScheduledJobs(); }} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${showScheduledBoard ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Find Work</button>
                  </div>
                  <button onClick={loadScheduledJobs} className="w-8 h-8 flex items-center justify-center border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition bg-white shadow-xs cursor-pointer"><RefreshCw size={14} /></button>
                </div>
              </div>

              {loadingScheduled ? (
                <div className="py-16 text-center text-slate-400 text-sm font-medium">Loading schedule...</div>
              ) : (
                <div className="divide-y divide-slate-100 border-t border-b border-slate-100">
                  {!showScheduledBoard ? (
                    scheduledJobs.length > 0 ? (
                      scheduledJobs.map((job: ScheduledJob) => (
                        <div key={job.id} className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs font-body">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                              <span className="font-bold text-sm text-slate-900 font-heading">{job.cargoType}</span>
                              <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{formatDate(job.scheduledAt)}</span>
                            </div>
                            <p className="text-slate-600 mb-1.5">Route: <span className="font-medium text-slate-900">{job.pickupAddress} &rarr; {job.dropoffAddress}</span></p>
                            <div className="text-slate-500 flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-slate-700">₹{Math.round(job.price)}</span>
                              <span>&middot;</span>
                              <span>{job.weightKg} kg</span>
                              <span>&middot;</span>
                              <span>{job.distanceKm} km</span>
                            </div>
                          </div>
                          <button onClick={fetchRoute} className="bg-slate-950 hover:bg-slate-800 text-white px-4 py-2 text-xs font-bold rounded-lg cursor-pointer shrink-0 font-heading self-start md:self-center">
                            Optimize Route
                          </button>
                        </div>
                      ))
                    ) : (
                      <EmptyState icon={CalendarClock} title="No committed schedules" description="Go to 'Find Work' to reserve upcoming calendar routes." />
                    )
                  ) : (
                    availableScheduledJobs.length > 0 ? (
                      availableScheduledJobs.map((job: ScheduledJob) => (
                        <div key={job.id} className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs font-body">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                              <span className="font-bold text-sm text-slate-900 font-heading">{job.cargoType}</span>
                              <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{formatDate(job.scheduledAt)}</span>
                            </div>
                            <p className="text-slate-600 mb-1.5">Route: <span className="font-medium text-slate-900">{job.pickupAddress} &rarr; {job.dropoffAddress}</span></p>
                            <div className="text-slate-500 flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-slate-700">₹{Math.round(job.price)}</span>
                              <span>&middot;</span>
                              <span>{job.weightKg} kg</span>
                              <span>&middot;</span>
                              <span>{job.distanceKm} km</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleCommitScheduledJob(job.id)}
                            disabled={committingJobId === job.id}
                            className="bg-slate-950 hover:bg-slate-800 disabled:opacity-60 text-white px-4 py-2 text-xs font-bold rounded-lg cursor-pointer shrink-0 font-heading self-start md:self-center"
                          >
                            {committingJobId === job.id ? 'Reserving...' : 'Reserve Load'}
                          </button>
                        </div>
                      ))
                    ) : (
                      <EmptyState icon={Briefcase} title="No loads to reserve" description="Check back later for available contract schedule jobs." />
                    )
                  )}
                </div>
              )}
            </div>
          )}

          {}
          {activeTab === 'past_jobs' && (
            <div className="space-y-4 max-w-4xl mx-auto w-full">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-heading">Past Trips</h3>
                  <p className="text-xs text-slate-500">History of completed and canceled trips</p>
                </div>
              </div>

              <div className="divide-y divide-slate-100 border-t border-b border-slate-100">
                {pastBookings.length > 0 ? (
                  pastBookings.map((b: any) => (
                    <div key={b.id} className="py-4 flex items-center justify-between gap-4 text-xs font-body">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                          <span className="font-bold text-sm text-slate-900 font-heading">{b.cargoType}</span>
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">#{b.id.slice(0, 8).toUpperCase()}</span>
                          <StatusBadge status={b.status} />
                        </div>
                        {b.pickupAddress && b.dropoffAddress && (
                          <p className="text-slate-600 mb-1">
                            {b.pickupAddress.split(',')[0]} &rarr; {b.dropoffAddress.split(',')[0]}
                          </p>
                        )}
                        <div className="text-slate-500 flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-700">₹{Math.round(b.price)}</span>
                          <span>&middot;</span>
                          <span>{formatDate(b.createdAt)}</span>
                        </div>
                      </div>
                      <button onClick={() => navigate(`/track/${b.id}`)} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 text-xs font-bold rounded-lg cursor-pointer shrink-0 font-heading">
                        Trip Log
                      </button>
                    </div>
                  ))
                ) : (
                  <EmptyState icon={FileText} title="No trip history found" description="Completed shipments will be listed here." />
                )}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

export default DriverDashboard;
