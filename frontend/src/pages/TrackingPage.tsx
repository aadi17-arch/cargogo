import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { io } from 'socket.io-client';
import api, { SOCKET_URL } from '../services/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function TrackingPage() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<[number, number] | null>(null);
  const [otp, setOtp] = useState('');
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const socket = io(SOCKET_URL, { auth: { token } });

    socket.on('driver:location:update', (data: any) => {
      if (data.bookingId === bookingId) {
        setDriverLocation([data.lat, data.lng]);
      }
    });

    socket.on('trip:completed', () => {
      alert('Trip completed!');
    });

    fetchBooking();
    return () => { socket.disconnect(); };
  }, [bookingId, token]);

  const fetchBooking = async () => {
    const res = await api.get(`/bookings/${bookingId}`);
    setBooking(res.data.data);
  };

  const verifyOTP = async (type: 'pickup' | 'dropoff') => {
    try {
      await api.post(`/bookings/${bookingId}/${type}`, {
        otp
      });
      alert(`${type} verified!`);
      setOtp('');
      fetchBooking();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Invalid OTP');
    }
  };

  if (!booking) return <div>Loading...</div>;

  const pickup: [number, number] = [booking.pickupLat, booking.pickupLng];
  const dropoff: [number, number] = [booking.dropoffLat, booking.dropoffLng];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Track Booking</h2>
      <div className="bg-white p-4 rounded-lg shadow">
        <p>Status: <span className="font-bold">{booking.status}</span></p>
        <p>Cargo: {booking.cargoType}</p>
        <p>Price: ₹{booking.price}</p>
      </div>

      <div className="h-96 rounded-lg overflow-hidden shadow">
        <MapContainer center={pickup} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={pickup}>
            <Popup>Pickup</Popup>
          </Marker>
          <Marker position={dropoff}>
            <Popup>Dropoff</Popup>
          </Marker>
          {driverLocation && <Marker position={driverLocation}><Popup>Driver</Popup></Marker>}
          <Polyline positions={[pickup, dropoff]} color="blue" />
          {driverLocation && <Polyline positions={[pickup, driverLocation]} color="green" />}
        </MapContainer>
      </div>

      {booking.status === 'ACCEPTED' && (
        <div className="bg-yellow-50 p-4 rounded-lg">
          {user.role === 'DRIVER' ? (
            <>
              <p className="font-bold mb-2">Enter Pickup OTP to start trip</p>
              <input value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={4} className="p-2 border rounded w-32 text-center text-2xl tracking-widest" placeholder="0000" />
              <button onClick={() => verifyOTP('pickup')} className="ml-2 bg-green-600 text-white px-4 py-2 rounded">Verify Pickup</button>
            </>
          ) : (
            <p className="font-bold text-yellow-800 text-lg">
              Share this Pickup OTP with your driver to start the trip: <span className="bg-yellow-200 px-3 py-1 rounded font-mono text-2xl ml-2">{booking.pickupOTP}</span>
            </p>
          )}
        </div>
      )}

      {booking.status === 'IN_TRANSIT' && (
        <div className="bg-blue-50 p-4 rounded-lg">
          {user.role === 'DRIVER' ? (
            <>
              <p className="font-bold mb-2">Enter Dropoff OTP to complete</p>
              <input value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={4} className="p-2 border rounded w-32 text-center text-2xl tracking-widest" placeholder="0000" />
              <button onClick={() => verifyOTP('dropoff')} className="ml-2 bg-green-600 text-white px-4 py-2 rounded">Verify Dropoff</button>
            </>
          ) : (
            <p className="font-bold text-blue-800 text-lg">
              Share this Dropoff OTP with your driver to complete the delivery: <span className="bg-blue-200 px-3 py-1 rounded font-mono text-2xl ml-2">{booking.dropoffOTP}</span>
            </p>
          )}
        </div>
      )}

      {booking.status === 'DELIVERED' && (
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <p className="text-2xl font-bold text-green-700">Delivered!</p>
        </div>
      )}
    </div>
  );
}

export default TrackingPage;
