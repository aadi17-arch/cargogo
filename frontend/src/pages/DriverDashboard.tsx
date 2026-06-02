import { useState, useEffect, useRef } from 'react';
import api, { SOCKET_URL } from '../services/api';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

function DriverDashboard() {
  const [isOnline, setIsOnline] = useState(false);
  const [bid, setBid] = useState<any>(null);
  const [countdown, setCountdown] = useState(30);
  const [earnings, setEarnings] = useState(0);
  const [bookings, setBookings] = useState<any[]>([]);
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'my_jobs' | 'jobs_board'>('my_jobs');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const loadProfile = async () => {
    try {
      const res = await api.post('/auth/me');
      if (res.data.success && res.data.data.driverProfile) {
        setIsOnline(res.data.data.driverProfile.isOnline);
      }
    } catch (err: any) {
      console.error('Failed to load profile:', err.response?.data?.message || err.message);
    }
  };

  const loadBookings = async () => {
    try {
      const res = await api.get('/bookings/my');
      if (res.data.success) {
        const myBookings = res.data.data;
        setBookings(myBookings);
        const total = myBookings
          .filter((b: any) => b.status === 'DELIVERED' || b.status === 'COMPLETED')
          .reduce((sum: number, b: any) => sum + b.price, 0);
        setEarnings(total);
      }
    } catch (err: any) {
      console.error('Failed to load bookings:', err.response?.data?.message || err.message);
    }
  };

  const loadPendingBookings = async () => {
    try {
      const res = await api.get('/bookings/pending');
      if (res.data.success) {
        setPendingBookings(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load pending bookings:', err.message);
    }
  };
  const socket = useRef<any>(null);

  useEffect(() => {
    if (!token) return;

    loadProfile();
    loadBookings();
    loadPendingBookings();

    socket.current = io(SOCKET_URL, { auth: { token } });

    socket.current.on('connect', () => console.log('Driver socket connected'));

    socket.current.on('incoming-bid', (data: any) => {
      setBid(data);
      setCountdown(30);
    });

    socket.current.on('bid-accepted', () => {
      alert('Bid accepted! Go to pickup.');
      setBid(null);
      loadBookings();
      loadPendingBookings();
    });

    return () => { socket.current?.disconnect(); };
  }, [token]);

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
      const newStatus = !isOnline;
      const res = await api.post('/drivers/online', {
        isOnline: newStatus,
        lat: 19.0760,
        lng: 72.8777
      });

      if (res.data.success) {
        setIsOnline(newStatus);
      } else {
        alert('Failed to update status: ' + (res.data.message || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Error updating status: ' + (err.response?.data?.message || err.message));
    }
  };

  const acceptBid = () => {
    try {

      socket.current?.emit('accept-bid', { bookingId: bid.bookingId });
      setBid(null);
    } catch (err: any) {
      alert('Error accepting bid: ' + err.message);
    }
  };

  const rejectBid = () => {
    try {
      socket.current?.emit('reject-bid', { bookingId: bid.bookingId });
      setBid(null);
    } catch (err: any) {
      alert('Error rejecting bid: ' + err.message);
    }
  };

  const handleAcceptPending = async (bookingId: string) => {
    try {
      const res = await api.post(`/bookings/${bookingId}/accept`);
      if (res.data.success) {
        alert('Shipment accepted successfully!');
        loadBookings();
        loadPendingBookings();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to accept shipment');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Driver Dashboard</h2>

      <div className="bg-white p-6 rounded-lg shadow flex justify-between items-center">
        <div>
          <p className="text-lg">Status: <span className={isOnline ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{isOnline ? 'ONLINE' : 'OFFLINE'}</span></p>
          <p className="text-gray-500">Earnings: ₹{earnings}</p>
        </div>
        <button onClick={toggleOnline} className={`px-6 py-3 rounded-lg font-bold text-white ${isOnline ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
          {isOnline ? 'Go Offline' : 'Go Online'}
        </button>
      </div>

      {bid && (
        <div className="bg-yellow-50 border-2 border-yellow-400 p-6 rounded-lg shadow-lg animate-pulse">
          <h3 className="text-xl font-bold text-yellow-800 mb-2">INCOMING BID!</h3>
          <p>Cargo: {bid.cargoType}</p>
          <p>Price: ₹{bid.price}</p>
          <p>Distance: {bid.distanceKm} km</p>
          <p className="text-2xl font-bold text-red-600 mt-2">{countdown}s</p>
          <div className="flex gap-4 mt-4">
            <button onClick={acceptBid} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700">ACCEPT</button>
            <button onClick={rejectBid} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700">REJECT</button>
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
          My Active Shipments
        </button>
        <button
          onClick={() => {
            setActiveTab('jobs_board');
            loadPendingBookings();
          }}
          className={`py-3 px-6 font-semibold border-b-2 transition-all ${
            activeTab === 'jobs_board'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Available Jobs Board ({pendingBookings.length})
        </button>
      </div>

      {activeTab === 'my_jobs' && (
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Accepted Shipments</h3>
            <button onClick={loadBookings} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm font-medium">Refresh</button>
          </div>
          {bookings.length > 0 ? (
            <div className="space-y-2">
              {bookings.map((b: any) => (
                <div key={b.id} className="border p-3 rounded flex justify-between items-center bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-800">{b.cargoType} — <span className="text-blue-600 font-bold">{b.status}</span></p>
                    <p className="text-sm text-gray-500">Price: ₹{b.price} | Weight: {b.weightKg}kg</p>
                  </div>
                  {b.status !== 'DELIVERED' && b.status !== 'CANCELLED' && (
                    <button
                      onClick={() => navigate(`/track/${b.id}`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm"
                    >
                      Verify OTP / Track
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">You have no active accepted shipments. Go online to receive live matching bids!</p>
          )}
        </div>
      )}

      {activeTab === 'jobs_board' && (
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Pending Shipments Pool</h3>
            <button onClick={loadPendingBookings} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm font-medium">Refresh Board</button>
          </div>
          {pendingBookings.length > 0 ? (
            <div className="space-y-3">
              {pendingBookings.map((b: any) => (
                <div key={b.id} className="border border-gray-100 p-4 rounded-lg bg-gray-50 flex justify-between items-center shadow-sm">
                  <div>
                    <p className="font-semibold text-gray-900">{b.cargoType}</p>
                    <p className="text-sm text-gray-600">Payout: <span className="text-green-600 font-bold">₹{b.price}</span> | Dist: {b.distanceKm} km</p>
                    <p className="text-xs text-gray-400 mt-1">Created: {new Date(b.createdAt).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => handleAcceptPending(b.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all"
                  >
                    Accept Shipment
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No pending shipments found at the moment. Check back soon!</p>
          )}
        </div>
      )}

      {!bid && isOnline && activeTab === 'my_jobs' && (
        <div className="bg-gray-100 p-6 rounded-lg text-center text-gray-500">
          Waiting for live bookings nearby...
        </div>
      )}
    </div>
  );
}

export default DriverDashboard;
