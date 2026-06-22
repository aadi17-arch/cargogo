import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBooking } from '@/hooks/useBooking';
import { useDriverStatus } from '@/hooks/useDriverStatus';
import { useSocket } from '@/hooks/useSocket';
import { driverService } from '@/services/driver.service';
import { VrpRouteResponse } from '@/types/driver.types';
import { toast } from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function DriverDashboard() {
  const { token } = useAuth();
  const { bookings, fetchMyBookings, fetchPendingBookings, acceptBooking: apiAcceptBooking } = useBooking();
  const { isOnline, updateStatus } = useDriverStatus();
  const { acceptBid: socketAcceptBid, rejectBid: socketRejectBid, on } = useSocket(token);

  const [bid, setBid] = useState<any>(null);
  const [countdown, setCountdown] = useState(30);
  const [earnings, setEarnings] = useState(0);
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'my_jobs' | 'jobs_board'>('my_jobs');
  const [routeData, setRouteData] = useState<VrpRouteResponse | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [driverCoords, setDriverCoords] = useState<[number, number] | null>(null);
  const navigate = useNavigate();

  const loadData = async () => {
    await fetchMyBookings();
    try {
      const pending = await fetchPendingBookings();
      setPendingBookings(pending || []);
    } catch (err) {
      console.error(err);
    }
    fetchRoute();
  };

  const fetchRoute = async () => {
    setLoadingRoute(true);
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setDriverCoords([latitude, longitude]);
            const data = await driverService.getOptimizedRoute(latitude, longitude);
            setRouteData(data);
            setLoadingRoute(false);
          },
          async () => {
            setDriverCoords([19.0760, 72.8777]); // fallback to Mumbai coords
            const data = await driverService.getOptimizedRoute();
            setRouteData(data);
            setLoadingRoute(false);
          }
        );
      } else {
        setDriverCoords([19.0760, 72.8777]); // fallback to Mumbai coords
        const data = await driverService.getOptimizedRoute();
        setRouteData(data);
        setLoadingRoute(false);
      }
    } catch (err) {
      console.error('Failed to fetch optimized route:', err);
      setLoadingRoute(false);
    }
  };

  useEffect(() => {
    if (!token) return;

    loadData();

    const offIncomingBid = on('incoming-bid', (data: any) => {
      setBid(data);
      setCountdown(30);
    });

    const offBidAccepted = on('bid-accepted', () => {
      toast.success('Bid accepted! Go to pickup.');
      setBid(null);
      loadData();
    });

    const offLocation = on('driver:location:update', (data: any) => {
      if (data && data.lat && data.lng) {
        setDriverCoords([data.lat, data.lng]);
      }
    });

    const offArrived = on('driver:arrived', () => {
      loadData();
    });

    return () => {
      offIncomingBid();
      offBidAccepted();
      offLocation();
      offArrived();
    };
  }, [token, on]);

  useEffect(() => {
    const total = bookings
      .filter((b: any) => b.status === 'DELIVERED' || b.status === 'COMPLETED')
      .reduce((sum: number, b: any) => sum + b.price, 0);
    setEarnings(total);
  }, [bookings]);

  useEffect(() => {
    if (!bid) return;
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { setBid(null); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [bid]);

  const toggleOnline = async () => {
    try {
      if (!isOnline) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          await updateStatus('ONLINE', latitude,longitude);
        },
          (e) => {
            toast.error('Location access is required to go online: ' + e.message);
          }
        )
      }
      else {
        await updateStatus('OFFLINE', 0, 0);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handleAcceptBid = () => {
    try {
      socketAcceptBid(bid.bookingId);
      setBid(null);
    } catch (err: any) {
      toast.error('Error accepting bid: ' + err.message);
    }
  };

  const handleRejectBid = () => {
    try {
      socketRejectBid(bid.bookingId);
      setBid(null);
    } catch (err: any) {
      toast.error('Error rejecting bid: ' + err.message);
    }
  };

  const handleAcceptPending = async (bookingId: string) => {
    try {
      await apiAcceptBooking(bookingId);
      // Switch to My Shipments and refresh immediately — no manual tap needed
      setActiveTab('my_jobs');
      await fetchMyBookings();
      // Refresh pending list too (remove accepted job from board)
      const updated = await fetchPendingBookings();
      setPendingBookings(updated || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to accept shipment');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-[24px] font-bold tracking-tight" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>Driver Dashboard</h2>

      <div className="p-4 sm:p-6 shadow-none flex justify-between items-center" style={{ backgroundColor: 'var(--color-card)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--radius-card)' }}>
        <div>
          <p className="text-base sm:text-lg font-semibold" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-body)' }}>Status: <span className="font-bold" style={{ color: isOnline ? 'var(--color-status-completed)' : 'var(--color-status-cancelled)' }}>{isOnline ? 'Online' : 'Offline'}</span></p>
          <p className="text-xs sm:text-sm font-medium mt-1" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>Earnings: <span className="font-semibold" style={{ color: 'var(--color-status-completed)' }}>₹{earnings}</span></p>
        </div>
        <button 
          onClick={toggleOnline} 
          className="px-4 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-bold text-white transition-all animate-none"
          style={{
            borderRadius: 'var(--radius-button)',
            backgroundColor: isOnline ? 'var(--color-status-cancelled)' : 'var(--color-primary)',
            fontFamily: 'var(--font-heading)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isOnline ? 'var(--color-status-cancelled)' : 'var(--color-primary-hover)';
            if (isOnline) e.currentTarget.style.opacity = '0.9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isOnline ? 'var(--color-status-cancelled)' : 'var(--color-primary)';
            e.currentTarget.style.opacity = '1';
          }}
        >
          {isOnline ? 'Go Offline' : 'Go Online'}
        </button>
      </div>

      {bid && (
        <div className="p-4 sm:p-6 shadow-none" style={{ backgroundColor: 'var(--color-card)', border: 'var(--border-width) solid var(--color-primary)', borderRadius: 'var(--radius-card)' }}>
          <h3 className="text-lg sm:text-xl font-bold mb-2" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-heading)' }}>New Delivery Request!</h3>
          <p style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-body)' }}>Cargo: {bid.cargoType}</p>
          <p style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-body)' }}>Payout: ₹{bid.price}</p>
          <p style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-body)' }}>Distance: {bid.distanceKm} km</p>
          <p className="text-xl sm:text-2xl font-bold mt-2" style={{ color: 'var(--color-status-cancelled)', fontFamily: 'var(--font-heading)' }}>Time left: {countdown}s</p>
          <div className="flex gap-4 mt-4">
            <button onClick={handleAcceptBid} className="flex-1 text-white py-2.5 sm:py-3 font-bold transition-all text-sm" style={{ backgroundColor: 'var(--color-status-completed)', borderRadius: 'var(--radius-button)', fontFamily: 'var(--font-heading)' }}>Accept</button>
            <button onClick={handleRejectBid} className="flex-1 text-white py-2.5 sm:py-3 font-bold transition-all text-sm" style={{ backgroundColor: 'var(--color-status-cancelled)', borderRadius: 'var(--radius-button)', fontFamily: 'var(--font-heading)' }}>Decline</button>
          </div>
        </div>
      )}

      <div className="flex border-b border-[var(--color-border)]">
        <button
          onClick={() => setActiveTab('my_jobs')}
          className="py-2.5 px-4 sm:py-3 sm:px-6 text-sm sm:text-base font-bold border-b-2 transition-all hover:text-[var(--color-text-main)]"
          style={{
            borderColor: activeTab === 'my_jobs' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'my_jobs' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            fontFamily: 'var(--font-heading)'
          }}
        >
          My Deliveries
        </button>
        <button
          onClick={() => {
            setActiveTab('jobs_board');
            loadData();
          }}
          className="py-2.5 px-4 sm:py-3 sm:px-6 text-sm sm:text-base font-bold border-b-2 transition-all hover:text-[var(--color-text-main)]"
          style={{
            borderColor: activeTab === 'jobs_board' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'jobs_board' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            fontFamily: 'var(--font-heading)'
          }}
        >
          Available Deliveries ({pendingBookings.length})
        </button>
      </div>

      {activeTab === 'my_jobs' && bookings.length === 0 && (
        <div className="p-6 text-center font-medium" style={{ backgroundColor: 'var(--color-card)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--radius-card)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>
          No active shipments. Go online to receive orders!
        </div>
      )}

      {activeTab === 'my_jobs' && bookings.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
          {/* Left Column: Unified Delivery Timeline (order-2 on mobile) */}
          <div className="lg:col-span-5 space-y-6 w-full order-2 lg:order-1">
            {/* Optimized Delivery Timeline Card */}
            <div className="p-4 sm:p-6 shadow-none space-y-4" style={{ backgroundColor: 'var(--color-card)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--radius-card)' }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>Delivery Timeline</h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5" style={{ fontFamily: 'var(--font-body)' }}>Optimized stop-by-stop route sequence</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={loadData} 
                    className="px-2.5 py-1.5 text-xs font-bold transition-all hover:bg-[var(--color-background)]"
                    style={{
                      backgroundColor: 'var(--color-card)',
                      color: 'var(--color-text-muted)',
                      border: 'var(--border-width) solid ' + (loadingRoute ? 'transparent' : 'var(--color-input-border)'),
                      borderRadius: 'var(--radius-button)',
                      fontFamily: 'var(--font-heading)'
                    }}
                  >
                    Refresh
                  </button>
                  <button
                    onClick={fetchRoute}
                    disabled={loadingRoute}
                    className="bg-[var(--color-card)] border-[var(--color-input-border)] px-3 py-1.5 text-xs font-bold hover:bg-[var(--color-background)] transition disabled:opacity-50"
                    style={{ color: 'var(--color-text-muted)', border: 'var(--border-width) solid var(--color-input-border)', borderRadius: 'var(--radius-button)', fontFamily: 'var(--font-heading)' }}
                  >
                    {loadingRoute ? 'Planning...' : 'Re-plan'}
                  </button>
                </div>
              </div>

              {routeData && routeData.route.length > 0 ? (
                <div className="space-y-4">
                  <div className="relative border-l ml-3 pl-6 space-y-5" style={{ borderColor: 'var(--color-border)' }}>
                    {routeData.route.map((stop: any, index: number) => {
                      const booking = bookings.find((b: any) => b.id === stop.bookingId);
                      const status = booking?.status || 'PENDING';
                      
                      return (
                        <div key={index} className="relative">
                          <span className="absolute -left-[35px] top-3.5 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold bg-[var(--color-card)] shadow-none" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)' }}>
                            {index + 1}
                          </span>
                          
                          <div className="p-3 flex flex-col gap-2" style={{ backgroundColor: 'var(--color-background)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--radius-card)' }}>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span 
                                  className="text-[8px] font-extrabold tracking-wide uppercase px-1.5 py-0.5 rounded-[4px] border bg-transparent shrink-0"
                                  style={{
                                    fontFamily: 'var(--font-mono)',
                                    borderColor: stop.type === 'PICKUP' ? 'var(--color-status-completed)' : 'var(--color-status-transit)',
                                    color: stop.type === 'PICKUP' ? 'var(--color-status-completed)' : 'var(--color-status-transit)'
                                  }}
                                >
                                  {stop.type === 'PICKUP' ? 'Pick' : 'Drop'}
                                </span>
                                <span className="text-xs font-bold text-[var(--color-text-main)] truncate" style={{ fontFamily: 'var(--font-heading)' }}>
                                  {stop.cargoType}
                                </span>
                              </div>

                              {booking && (
                                <span 
                                  className="px-1.5 py-0.5 rounded-[4px] text-[8px] font-bold tracking-wide uppercase border-[1.5px] bg-transparent shrink-0"
                                  style={{
                                    fontFamily: 'var(--font-mono)',
                                    borderColor: 
                                      status === 'PENDING' ? 'var(--color-status-pending)' :
                                      status === 'ACCEPTED' ? 'var(--color-status-accepted)' :
                                      status === 'IN_TRANSIT' ? 'var(--color-status-transit)' :
                                      status === 'DELIVERED' ? 'var(--color-status-delivered)' :
                                      status === 'COMPLETED' ? 'var(--color-status-completed)' :
                                      status === 'CANCELLED' ? 'var(--color-status-cancelled)' : 'var(--color-text-muted)',
                                    color:
                                      status === 'PENDING' ? 'var(--color-status-pending)' :
                                      status === 'ACCEPTED' ? 'var(--color-status-accepted)' :
                                      status === 'IN_TRANSIT' ? 'var(--color-status-transit)' :
                                      status === 'DELIVERED' ? 'var(--color-status-delivered)' :
                                      status === 'COMPLETED' ? 'var(--color-status-completed)' :
                                      status === 'CANCELLED' ? 'var(--color-status-cancelled)' : 'var(--color-text-muted)'
                                  }}
                                >
                                  {status}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-[var(--color-border)] border-dashed">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-[var(--color-text-muted)]" style={{ fontFamily: 'var(--font-body)' }}>
                                <span>Payout: <span className="font-semibold text-[var(--color-primary)]">₹{(booking as any)?.price || booking?.totalPrice || 0}</span></span>
                                <span className="text-[var(--color-border)]">|</span>
                                <span>Wt: <span className="font-medium text-[var(--color-text-main)]">{stop.weightKg}kg</span></span>
                                <span className="text-[var(--color-border)]">|</span>
                                <span>Load: <span className="font-medium text-[var(--color-text-main)]">{stop.expectedAccumulatedWeight}kg</span></span>
                              </div>

                              {booking && status !== 'CANCELLED' && (
                                <button
                                  onClick={() => navigate(`/track/${booking.id}`)}
                                  className="text-white px-2.5 py-1 text-[10px] font-bold hover:opacity-90 transition rounded-[4px] shrink-0"
                                  style={{ backgroundColor: 'var(--color-primary)', fontFamily: 'var(--font-heading)' }}
                                >
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
                <div className="space-y-4">
                  <p className="text-xs text-center py-4" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>No active route sequence stops found. Showing raw accepted bookings list below:</p>
                  <div className="divide-y divide-[var(--color-border)]">
                    {bookings.map((b: any) => (
                      <div key={b.id} className="py-3 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-semibold text-[var(--color-text-main)]">{b.cargoType}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">Payout: ₹{b.price} | Status: {b.status}</p>
                        </div>
                        <button
                          onClick={() => navigate(`/track/${b.id}`)}
                          className="text-white px-3 py-1 text-xs font-bold hover:opacity-90 transition"
                          style={{ backgroundColor: 'var(--color-primary)', borderRadius: 'var(--radius-button)' }}
                        >
                          Track
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sticky Route Map (order-1 on mobile) */}
          <div className="lg:col-span-7 lg:sticky lg:top-[88px] w-full order-1 lg:order-2">
            {routeData && routeData.route.length > 0 && (
              <div className="p-4 sm:p-6 shadow-none space-y-4" style={{ backgroundColor: 'var(--color-card)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--radius-card)' }}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>Active Route Map</h3>
                    <p className="text-[10px] sm:text-xs text-[var(--color-text-muted)] mt-1" style={{ fontFamily: 'var(--font-body)' }}>
                      Total Distance: <span className="font-bold text-[var(--color-text-main)]">{routeData.totalDistanceKm} km</span> | Max Capacity: {routeData.vehicleCapacityKg} kg
                    </p>
                  </div>
                </div>
                
                {/* VRP Multi-Stop Optimized Route Map */}
                <div className="h-[300px] sm:h-[400px] lg:h-[480px] overflow-hidden shadow-none" style={{ border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--radius-card)' }}>
                  <MapContainer 
                    center={driverCoords || [routeData.route[0].location.lat, routeData.route[0].location.lng]} 
                    zoom={11} 
                    style={{ height: '100%', width: '100%', zIndex: 1 }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {driverCoords && (
                      <Marker position={driverCoords} icon={driverIcon}>
                        <Popup>Your Location (Driver)</Popup>
                      </Marker>
                    )}
                    {routeData.route.map((stop: any, idx: number) => (
                      <Marker key={idx} position={[stop.location.lat, stop.location.lng]}>
                        <Popup>
                          <strong>Stop {idx + 1}</strong>: {stop.type === 'PICKUP' ? 'Pickup' : 'Dropoff'} ({stop.cargoType})
                        </Popup>
                      </Marker>
                    ))}
                    {/* Plot optimized connection path (polyline) connecting driver location to VRP stops sequentially */}
                    <Polyline 
                      positions={[
                        ...(driverCoords ? [driverCoords] : []),
                        ...routeData.route.map((stop: any) => [stop.location.lat, stop.location.lng] as [number, number])
                      ]} 
                      color="indigo" 
                    />
                  </MapContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'jobs_board' && (
        <div className="p-6 shadow-none space-y-4" style={{ backgroundColor: 'var(--color-card)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--radius-card)' }}>
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>Available Deliveries</h3>
            <button 
              onClick={loadData} 
              className="px-4 py-1.5 text-sm font-bold transition-all hover:bg-[var(--color-background)]"
              style={{
                backgroundColor: 'var(--color-card)',
                color: 'var(--color-text-muted)',
                border: 'var(--border-width) solid var(--color-input-border)',
                borderRadius: 'var(--radius-button)',
                fontFamily: 'var(--font-heading)'
              }}
            >
              Refresh
            </button>
          </div>
          {pendingBookings.length > 0 ? (
            <div className="divide-y divide-[var(--color-border)]">
              {pendingBookings.map((b: any) => (
                <div key={b.id} className="py-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-semibold text-[var(--color-text-main)]" style={{ fontFamily: 'var(--font-heading)' }}>{b.cargoType}</p>
                    <p className="text-xs font-medium text-[var(--color-text-muted)]" style={{ fontFamily: 'var(--font-body)' }}>
                      Payout: <span className="text-[var(--color-primary)] font-semibold">₹{b.price}</span> | Distance: <span className="font-semibold text-[var(--color-text-main)]">{b.distanceKm} km</span>
                    </p>
                    <p className="text-[10px] text-[var(--color-text-muted)]" style={{ fontFamily: 'var(--font-mono)' }}>Received: {new Date(b.createdAt).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => handleAcceptPending(b.id)}
                    className="text-white px-4 py-2 text-xs font-bold hover:opacity-90 transition shrink-0"
                    style={{ backgroundColor: 'var(--color-primary)', borderRadius: 'var(--radius-button)', fontFamily: 'var(--font-heading)' }}
                  >
                    Accept
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>No shipments found. Check back soon!</p>
          )}
        </div>
      )}

      {!bid && isOnline && activeTab === 'my_jobs' && (
        <div className="p-6 text-center font-medium" style={{ backgroundColor: 'var(--color-card)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--radius-card)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>
          Waiting for deliveries...
        </div>
      )}
    </div>
  );
}

export default DriverDashboard;
