import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBooking } from '@/hooks/useBooking';
import { useDriverStatus } from '@/hooks/useDriverStatus';
import { useSocket } from '@/hooks/useSocket';

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
  const navigate = useNavigate();

  const loadData = async () => {
    await fetchMyBookings();
    try {
      const pending = await fetchPendingBookings();
      setPendingBookings(pending || []);
    } catch (err) {
      console.error(err);
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
      <h2 className="text-2xl font-bold">Driver Dashboard</h2>

      <div className="bg-white p-6 rounded-lg shadow flex justify-between items-center">
        <div>
          <p className="text-lg">Status: <span className={isOnline ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{isOnline ? 'Online' : 'Offline'}</span></p>
          <p className="text-gray-500">Earnings: ₹{earnings}</p>
        </div>
        <button onClick={toggleOnline} className={`px-6 py-3 rounded-lg font-bold text-white transition ${isOnline ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
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
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Accepted Shipments</h3>
            <button onClick={fetchMyBookings} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm font-medium transition">Refresh</button>
          </div>
          {bookings.length > 0 ? (
            <div className="space-y-2">
              {bookings.map((b: any) => (
                <div key={b.id} className="border p-3 rounded flex justify-between items-center bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-800">{b.cargoType} — <span className="text-blue-600 font-bold">{b.status}</span></p>
                    <p className="text-sm text-gray-500">Payout: ₹{b.price} | Weight: {b.weightKg}kg</p>
                  </div>
                  {b.status !== 'DELIVERED' && b.status !== 'CANCELLED' && (
                    <button
                      onClick={() => navigate(`/track/${b.id}`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm"
                    >
                      Track
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No active shipments. Go online to receive orders!</p>
          )}
        </div>
      )}

      {activeTab === 'jobs_board' && (
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Available Jobs</h3>
            <button onClick={loadData} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm font-medium transition">Refresh</button>
          </div>
          {pendingBookings.length > 0 ? (
            <div className="space-y-3">
              {pendingBookings.map((b: any) => (
                <div key={b.id} className="border border-gray-100 p-4 rounded-lg bg-gray-50 flex justify-between items-center shadow-sm">
                  <div>
                    <p className="font-semibold text-gray-900">{b.cargoType}</p>
                    <p className="text-sm text-gray-600">Payout: <span className="text-green-600 font-bold">₹{b.price}</span> | Distance: {b.distanceKm} km</p>
                    <p className="text-xs text-gray-400 mt-1">Received: {new Date(b.createdAt).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => handleAcceptPending(b.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all shadow-sm"
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
