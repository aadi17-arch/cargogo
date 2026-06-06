import { useState, useEffect } from 'react';
import api from '@/services/api';
import { SOCKET_URL } from '@/utils/constants';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';

function ShipperDashboard() {
  const [form, setForm] = useState({
    pickupLat: 19.0760,
    pickupLng: 72.8777,
    dropoffLat: 19.2183,
    dropoffLng: 72.9781,
    cargoType: 'Electronics',
    weightKg: 50,
    lengthCm: 100,
    widthCm: 60,
    heightCm: 40,
    vehicleType: 'MINI_TEMPO' as 'MINI_TEMPO' | 'PICKUP_TRUCK' | 'CONTAINER_3TON'
  });
  const [quote, setQuote] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const s = io(SOCKET_URL, { auth: { token } });
    setSocket(s);

    s.on('booking-accepted', (data: any) => {
      alert(`Driver ${data.driverName} has accepted your booking!`);
      fetchBookings();
    });

    s.on('no-drivers', (data: any) => {
      alert(`Driver matching update: ${data.message}`);
      fetchBookings();
    });

    fetchBookings();

    return () => {
      s.disconnect();
    };
  }, []);

  const getQuote = async () => {
    const volumetric = (form.lengthCm * form.widthCm * form.heightCm) / 5000;
    const chargeable = Math.max(form.weightKg, volumetric);
    setQuote({ volumetric, chargeable, estimated: chargeable * 4 + 50 + 19 * 12 });
  };

  const createBooking = async () => {
    try {
      const res = await api.post('/bookings/createBooking', form);
      const bookingId = res.data.data.booking.id;
      alert('Booking created! ID: ' + bookingId);
      
      if (socket) {
        socket.emit('book-cargo', { bookingId });
      }
      
      fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const fetchBookings = async () => {
    const res = await api.get('/bookings/my');
    setBookings(res.data.data);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Shipper Dashboard</h2>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Create Booking</h3>
        <div className="grid grid-cols-2 gap-4">
          <input placeholder="Pickup Lat" type="number" value={form.pickupLat} onChange={(e) => setForm({...form, pickupLat: +e.target.value})} className="p-2 border rounded" />
          <input placeholder="Pickup Lng" type="number" value={form.pickupLng} onChange={(e) => setForm({...form, pickupLng: +e.target.value})} className="p-2 border rounded" />
          <input placeholder="Dropoff Lat" type="number" value={form.dropoffLat} onChange={(e) => setForm({...form, dropoffLat: +e.target.value})} className="p-2 border rounded" />
          <input placeholder="Dropoff Lng" type="number" value={form.dropoffLng} onChange={(e) => setForm({...form, dropoffLng: +e.target.value})} className="p-2 border rounded" />
          <input placeholder="Cargo Type" value={form.cargoType} onChange={(e) => setForm({...form, cargoType: e.target.value})} className="p-2 border rounded" />
          <input placeholder="Weight (kg)" type="number" value={form.weightKg} onChange={(e) => setForm({...form, weightKg: +e.target.value})} className="p-2 border rounded" />
          <input placeholder="Length (cm)" type="number" value={form.lengthCm} onChange={(e) => setForm({...form, lengthCm: +e.target.value})} className="p-2 border rounded" />
          <input placeholder="Width (cm)" type="number" value={form.widthCm} onChange={(e) => setForm({...form, widthCm: +e.target.value})} className="p-2 border rounded" />
          <input placeholder="Height (cm)" type="number" value={form.heightCm} onChange={(e) => setForm({...form, heightCm: +e.target.value})} className="p-2 border rounded" />
          <select value={form.vehicleType} onChange={(e) => setForm({...form, vehicleType: e.target.value as any})} className="p-2 border rounded">
            <option value="MINI_TEMPO">Mini Tempo</option>
            <option value="PICKUP_TRUCK">Pickup Truck</option>
            <option value="CONTAINER_3TON">3-Ton Container</option>
          </select>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={getQuote} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Get Quote</button>
          <button onClick={createBooking} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Book Now</button>
        </div>
        {quote && (
          <div className="mt-4 bg-gray-100 p-4 rounded">
            <p>Volumetric Weight: {quote.volumetric} kg</p>
            <p>Chargeable Weight: {quote.chargeable} kg</p>
            <p>Estimated Price: ₹{quote.estimated}</p>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">My Bookings</h3>
        <button onClick={fetchBookings} className="mb-4 bg-gray-600 text-white px-4 py-2 rounded">Refresh</button>
        <div className="space-y-2">
          {bookings.map((b: any) => (
            <div key={b.id} className="border p-3 rounded flex justify-between items-center">
              <div>
                <p className="font-medium">{b.cargoType} — {b.status}</p>
                <p className="text-sm text-gray-500">₹{b.price} | OTP: {b.pickupOTP}</p>
              </div>
              <button onClick={() => navigate(`/track/${b.id}`)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
                Track
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ShipperDashboard;
