import { useEffect, useState } from "react";
import { io } from 'socket.io-client';
import api from "@/services/api";
import { useNavigate } from "react-router-dom";

function DriverDashboard() {
  const [isOnline, setIsOnline] = useState(() => {
    return localStorage.getItem('isOnline') === 'true';
  });
  const [bid, setBid] = useState<any>(null);
  const [countdown, setCountdown] = useState(30);
  const [earnings, setEarnings] = useState(0);
  const [bookings, setBookings] = useState<any[]>([]);
  const [socket, setSocket] = useState<any>(null);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const fetchBookings = async () => {
    try {
      const res = await api.get('bookings/my');
      const list = res.data.data || [];
      setBookings(list);

      // Calculate total earnings from completed deliveries
      const total = list
        .filter((b: any) => b.status === 'DELIVERED')
        .reduce((sum: number, b: any) => sum + (b.price || 0), 0);
      setEarnings(total);
    } catch (e) {
      console.error("Failed to fetch bookings", e);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    const s = io(`http://${window.location.hostname}:5000`, { auth: { token } });
    s.on('connect', () => console.log('Driver Socket connected'));
    s.on('incoming-bid', (data: any) => {
      setBid(data);
      setCountdown(30);
    });
    s.on('bid-accepted', () => {
      alert('Bid accepted! Go to pickup.');
      setBid(null);
      fetchBookings();
    });
    setSocket(s);
    return () => { s.disconnect(); };
  }, [token]);

  useEffect(() => {
    if (!bid) return;
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setBid(null);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [bid]);

  const toggleOnline = async () => {
    try {
      const newStatus = !isOnline;
      await api.post('drivers/online', {
        isOnline: newStatus,
        lat: 19.076,
        lng: 72.877
      });
      setIsOnline(newStatus);
      localStorage.setItem('isOnline', String(newStatus));
    } catch (e) {
      console.error("Failed", e);
    }
  };

  const acceptBid = async () => {
    if (socket && bid) {
      socket.emit('accept-bid', { bookingId: bid.bookingId });
      alert('Bid accepted! Go to pickup.');
      navigate(`/track/${bid.bookingId}`);
      setBid(null);
      fetchBookings();
    }
  };

  const rejectBid = async () => {
    if (socket && bid) {
      socket.emit('reject-bid', { bookingId: bid.bookingId });
    }
    setBid(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6 font-sans text-slate-900 bg-gray-50 min-h-screen">
      {/* Page Title Header */}
      <div className="bg-white p-6 border border-slate-200 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Driver Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your active duty status and view your trip earnings.</p>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Box */}
        <div className="bg-white p-6 border border-slate-200 shadow-sm">
          <h2 className="text-xs uppercase font-semibold text-slate-500 tracking-wider">Status</h2>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`h-3 w-3 rounded-full inline-block ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
              <span className="font-bold text-lg text-slate-800">{isOnline ? 'Online & Available' : 'Offline'}</span>
            </div>
            <button
              onClick={toggleOnline}
              className={`px-5 py-2 font-bold text-white transition-colors duration-150 rounded-none ${
                isOnline ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isOnline ? 'Go Offline' : 'Go Online'}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-4 leading-relaxed">
            {isOnline
              ? "Your location is active. Nearby shippers can see you and send load offers."
              : "You are offline. Go online to start receiving load requests."}
          </p>
        </div>

        {/* Earnings Box */}
        <div className="bg-white p-6 border border-slate-200 shadow-sm">
          <h2 className="text-xs uppercase font-semibold text-slate-500 tracking-wider">Total Earnings</h2>
          <div className="mt-4">
            <span className="text-4xl font-extrabold tracking-tight text-slate-900">₹{earnings}</span>
            <span className="text-sm font-semibold text-slate-400 ml-2">INR</span>
          </div>
          <div className="mt-6 border-t border-slate-100 pt-4 flex justify-between items-center text-xs text-slate-500">
            <span>Active Bookings Completed</span>
            <span className="font-bold text-slate-700">
              {bookings.filter((b: any) => b.status === 'DELIVERED').length}
            </span>
          </div>
        </div>
      </div>

      {/* Bidding Zone */}
      {bid && (
        <div className="bg-white border-2 border-amber-500 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Incoming Booking Bid</h3>
              <p className="text-xs text-slate-500">A shipper has requested your vehicle for transport.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-slate-200 bg-slate-50 p-4 mb-4">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase block">Cargo Type</span>
              <span className="text-sm font-bold text-slate-800 uppercase">{bid.cargoType}</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase block">Distance</span>
              <span className="text-sm font-bold text-slate-800">{bid.distanceKm} km</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase block">Price Offered</span>
              <span className="text-sm font-bold text-emerald-600">₹{bid.price}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 border border-slate-200">
              <span className="text-xs text-slate-600 uppercase font-semibold">Time to Accept:</span>
              <span className="text-xl font-bold text-rose-600 tabular-nums">{countdown}s</span>
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={acceptBid}
                className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 font-bold transition-colors duration-150 rounded-none"
              >
                ACCEPT BID
              </button>
              <button
                onClick={rejectBid}
                className="flex-1 sm:flex-initial bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 font-bold transition-colors duration-150 rounded-none"
              >
                REJECT BID
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty / Waiting state */}
      {!bid && isOnline && (
        <div className="bg-white p-12 text-center border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800">Waiting for Bookings...</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Searching for cargo shipments matching your profile in your current location radius.
          </p>
        </div>
      )}



      {/* Active Pickups & Deliveries List */}
      <div className="bg-white p-6 border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-6 pb-2 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">My Active Shipments</h2>
          <button
            onClick={fetchBookings}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-1.5 font-bold uppercase text-xs rounded-none transition-colors duration-150"
          >
            Refresh List
          </button>
        </div>

        {bookings.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-200 bg-slate-50 text-slate-400 font-bold uppercase text-xs">
            No active shipments assigned. Go online to receive dispatch bids.
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b: any) => (
              <div key={b.id} className="border border-slate-200 p-4 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-md text-slate-800">{b.cargoType}</span>
                    <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded-none border ${
                      b.status === 'COMPLETED' || b.status === 'DELIVERED'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : b.status === 'ACCEPTED' || b.status === 'IN_TRANSIT'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-slate-100 text-slate-800 border-slate-200'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                    <span>Payout: <strong className="text-slate-800">₹{b.price}</strong></span>
                    <span>Distance: <strong className="text-slate-800">{b.distanceKm} km</strong></span>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/track/${b.id}`)}
                  className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 font-bold uppercase text-xs rounded-none transition-colors duration-150 text-center"
                >
                  Open Tracking / Complete Delivery
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DriverDashboard;
