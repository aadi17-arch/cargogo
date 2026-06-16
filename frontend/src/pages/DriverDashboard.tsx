import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBooking } from '@/hooks/useBooking';
import { useDriverStatus } from '@/hooks/useDriverStatus';
import { useSocket } from '@/hooks/useSocket';
import { driverService } from '@/services/driver.service';
import { VrpRouteResponse } from '@/types/driver.types';

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
            const data = await driverService.getOptimizedRoute(latitude, longitude);
            setRouteData(data);
            setLoadingRoute(false);
          },
          async () => {
            const data = await driverService.getOptimizedRoute();
            setRouteData(data);
            setLoadingRoute(false);
          }
        );
      } else {
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
      alert('Bid accepted! Go to pickup.');
      setBid(null);
      loadData();
    });

    return () => {
      offIncomingBid();
      offBidAccepted();
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
            alert('Loaction access is granted is required to go online.' + e.message);
          }
        )
      }
      else {
        await updateStatus('OFFLINE', 0, 0);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleAcceptBid = () => {
    try {
      socketAcceptBid(bid.bookingId);
      setBid(null);
    } catch (err: any) {
      alert('Error accepting bid: ' + err.message);
    }
  };

  const handleRejectBid = () => {
    try {
      socketRejectBid(bid.bookingId);
      setBid(null);
    } catch (err: any) {
      alert('Error rejecting bid: ' + err.message);
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
      alert(err.message || 'Failed to accept shipment');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold text-slate-900 font-sans-outfit tracking-tight">Driver Dashboard</h2>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
        <div>
          <p className="text-lg font-semibold text-slate-800">Status: <span className={isOnline ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{isOnline ? 'Online' : 'Offline'}</span></p>
          <p className="text-sm text-slate-500 font-medium mt-1">Earnings: ₹{earnings}</p>
        </div>
        <button onClick={toggleOnline} className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white transition ${isOnline ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
          {isOnline ? 'Go Offline' : 'Go Online'}
        </button>
      </div>

      {bid && (
        <div className="bg-yellow-50 border-2 border-yellow-400 p-6 rounded-lg shadow-lg animate-pulse">
          <h3 className="text-xl font-bold text-yellow-800 mb-2">New Job!</h3>
          <p>Cargo: {bid.cargoType}</p>
          <p>Payout: ₹{bid.price}</p>
          <p>Distance: {bid.distanceKm} km</p>
          <p className="text-2xl font-bold text-red-600 mt-2">Time left: {countdown}s</p>
          <div className="flex gap-4 mt-4">
            <button onClick={handleAcceptBid} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition">Accept</button>
            <button onClick={handleRejectBid} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition">Decline</button>
          </div>
        </div>
      )}

      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('my_jobs')}
          className={`py-3 px-6 font-semibold border-b-2 transition-all ${
            activeTab === 'my_jobs'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          My Shipments
        </button>
        <button
          onClick={() => {
            setActiveTab('jobs_board');
            loadData();
          }}
          className={`py-3 px-6 font-semibold border-b-2 transition-all ${
            activeTab === 'jobs_board'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Available Jobs ({pendingBookings.length})
        </button>
      </div>

      {activeTab === 'my_jobs' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-slate-800 font-sans-outfit">Accepted Shipments</h3>
            <button onClick={fetchMyBookings} className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-1.5 rounded-xl text-sm font-semibold transition">Refresh</button>
          </div>
          {bookings.length > 0 ? (
            <div className="space-y-2">
              {bookings.map((b: any) => (
                <div key={b.id} className="border p-4 rounded-xl flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 bg-gray-50">
                  <div className="space-y-1.5">
                    <p className="font-medium text-slate-800 flex flex-wrap items-center gap-2 mb-1">
                      {b.cargoType}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                        b.status === 'PENDING' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                        b.status === 'ACCEPTED' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                        b.status === 'IN_TRANSIT' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                        b.status === 'DELIVERED' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                        b.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                        b.status === 'CANCELLED' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                        'bg-orange-50 text-orange-600 border-orange-200'
                      }`}>
                        {b.status}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 font-tech-space leading-relaxed">Payout: ₹{b.price} | Weight: {b.weightKg}kg</p>
                  </div>
                  {b.status !== 'CANCELLED' && (
                    <button
                      onClick={() => navigate(`/track/${b.id}`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm w-full sm:w-auto text-center shrink-0"
                    >
                      {['DELIVERED', 'COMPLETED'].includes(b.status) ? 'View Details' : 'Track'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No active shipments. Go online to receive orders!</p>
          )}

          {bookings.length > 0 && (
            <div className="mt-6 border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-semibold text-slate-800 font-sans-outfit">Route Stops</h4>
                <button
                  onClick={fetchRoute}
                  disabled={loadingRoute}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm"
                >
                  {loadingRoute ? 'Planning...' : 'Re-plan Route'}
                </button>
              </div>

              {routeData && routeData.route.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-xs text-gray-500 font-tech-space">
                    Total Distance: <span className="font-bold text-slate-800">{routeData.totalDistanceKm} km</span> | Max Weight: {routeData.vehicleCapacityKg} kg
                  </p>
                  <div className="relative border-l border-slate-200 ml-3 pl-6 space-y-4">
                    {routeData.route.map((stop: any, index: number) => (
                      <div key={index} className="relative">
                        {/* Timeline circle badge */}
                        <span className={`absolute -left-[35px] top-3.5 w-5 h-5 rounded-full border border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${
                          stop.type === 'PICKUP' ? 'bg-emerald-600' : 'bg-orange-600'
                        }`}>
                          {index + 1}
                        </span>
                        
                        {/* Stop Card */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-100/50 transition">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-md ${
                                stop.type === 'PICKUP' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
                              }`}>
                                {stop.type === 'PICKUP' ? 'Pickup' : 'Dropoff'}
                              </span>
                              <span className="text-sm font-semibold text-slate-800 font-sans-outfit">
                                {stop.cargoType}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-tech-space">
                              Weight: {stop.weightKg} kg
                            </p>
                          </div>
                          
                          <div className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] font-bold text-slate-600 font-tech-space sm:text-right shrink-0">
                            <span className="block text-slate-400 font-normal uppercase text-[8px] tracking-wider mb-0.5">Vehicle Load</span>
                            {stop.expectedAccumulatedWeight} kg
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-2 font-tech-space">No active route stops found.</p>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'jobs_board' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-slate-800 font-sans-outfit">Available Jobs</h3>
            <button onClick={loadData} className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-1.5 rounded-xl text-sm font-semibold transition">Refresh</button>
          </div>
          {pendingBookings.length > 0 ? (
            <div className="space-y-3">
              {pendingBookings.map((b: any) => (
                <div key={b.id} className="border border-slate-100 p-4 rounded-xl bg-gray-50 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 shadow-sm">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-800">{b.cargoType}</p>
                    <p className="text-xs text-gray-500 font-tech-space leading-relaxed">
                      Payout: <span className="text-green-600 font-bold">₹{b.price}</span> | Distance: {b.distanceKm} km
                    </p>
                    <p className="text-[10px] text-gray-400">Received: {new Date(b.createdAt).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => handleAcceptPending(b.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm w-full sm:w-auto text-center shrink-0"
                  >
                    Accept
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No shipments found. Check back soon!</p>
          )}
        </div>
      )}

      {!bid && isOnline && activeTab === 'my_jobs' && (
        <div className="bg-gray-100 p-6 rounded-lg text-center text-gray-500">
          Waiting for orders...
        </div>
      )}
    </div>
  );
}

export default DriverDashboard;
