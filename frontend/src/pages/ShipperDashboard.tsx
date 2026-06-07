import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBooking } from '@/hooks/useBooking';
import { useSocket } from '@/hooks/useSocket';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function ChangeMapView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

function ShipperDashboard() {
  const { token } = useAuth();
  const { bookings, fetchMyBookings, createBooking: apiCreateBooking } = useBooking();
  const { bookCargo, on } = useSocket(token);
  const navigate = useNavigate();

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

  const pickupMarkerRef = useRef<any>(null);
  const dropoffMarkerRef = useRef<any>(null);

  const pickupHandlers = useMemo(
    () => ({
      dragend() {
        const marker = pickupMarkerRef.current;
        if (marker != null) {
          const position = marker.getLatLng();
          setForm(prev => ({
            ...prev,
            pickupLat: Number(position.lat.toFixed(6)),
            pickupLng: Number(position.lng.toFixed(6)),
          }));
        }
      },
    }),
    []
  );

  const dropoffHandlers = useMemo(
    () => ({
      dragend() {
        const marker = dropoffMarkerRef.current;
        if (marker != null) {
          const position = marker.getLatLng();
          setForm(prev => ({
            ...prev,
            dropoffLat: Number(position.lat.toFixed(6)),
            dropoffLng: Number(position.lng.toFixed(6)),
          }));
        }
      },
    }),
    []
  );

  const locateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setForm((prev) => ({
          ...prev,
          pickupLat: Number(latitude.toFixed(6)),
          pickupLng: Number(longitude.toFixed(6)),
        }));
      },
      () => {
        alert('Could not retrieve your location. Please check browser permissions.');
      }
    );
  };

  useEffect(() => {
    fetchMyBookings();

    const offAccepted = on('booking-accepted', (data: any) => {
      alert(`Driver ${data.driverName} has accepted your booking!`);
      fetchMyBookings();
    });

    const offNoDrivers = on('no-drivers', (data: any) => {
      alert(`Driver matching update: ${data.message}`);
      fetchMyBookings();
    });

    return () => {
      offAccepted();
      offNoDrivers();
    };
  }, [on]);

  const getQuote = async () => {
    const volumetric = (form.lengthCm * form.widthCm * form.heightCm) / 5000;
    const chargeable = Math.max(form.weightKg, volumetric);
    setQuote({ volumetric, chargeable, estimated: chargeable * 4 + 50 + 19 * 12 });
  };

  const handleBooking = async () => {
    try {
      const booking = await apiCreateBooking(form);
      alert('Booking created! ID: ' + booking.id);
      bookCargo(booking.id);
      fetchMyBookings();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to create booking');
    }
  };

  const mapCenter: [number, number] = [form.pickupLat, form.pickupLng];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Shipper Dashboard</h2>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Create Booking</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Fields Column */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Lat</label>
                <input placeholder="Pickup Lat" type="number" step="any" value={form.pickupLat} onChange={(e) => setForm({...form, pickupLat: +e.target.value})} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Lng</label>
                <input placeholder="Pickup Lng" type="number" step="any" value={form.pickupLng} onChange={(e) => setForm({...form, pickupLng: +e.target.value})} className="w-full p-2 border rounded" />
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                type="button" 
                onClick={locateMe}
                className="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-100 flex items-center gap-1 transition"
              >
                📍 Use My Location
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dropoff Lat</label>
                <input placeholder="Dropoff Lat" type="number" step="any" value={form.dropoffLat} onChange={(e) => setForm({...form, dropoffLat: +e.target.value})} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dropoff Lng</label>
                <input placeholder="Dropoff Lng" type="number" step="any" value={form.dropoffLng} onChange={(e) => setForm({...form, dropoffLng: +e.target.value})} className="w-full p-2 border rounded" />
              </div>
            </div>

            <hr className="my-2" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cargo Type</label>
                <input placeholder="Cargo Type" value={form.cargoType} onChange={(e) => setForm({...form, cargoType: e.target.value})} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                <input placeholder="Weight (kg)" type="number" value={form.weightKg} onChange={(e) => setForm({...form, weightKg: +e.target.value})} className="w-full p-2 border rounded" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Length (cm)</label>
                <input placeholder="Length (cm)" type="number" value={form.lengthCm} onChange={(e) => setForm({...form, lengthCm: +e.target.value})} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Width (cm)</label>
                <input placeholder="Width (cm)" type="number" value={form.widthCm} onChange={(e) => setForm({...form, widthCm: +e.target.value})} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                <input placeholder="Height (cm)" type="number" value={form.heightCm} onChange={(e) => setForm({...form, heightCm: +e.target.value})} className="w-full p-2 border rounded" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
              <select value={form.vehicleType} onChange={(e) => setForm({...form, vehicleType: e.target.value as any})} className="w-full p-2 border rounded">
                <option value="MINI_TEMPO">Mini Tempo</option>
                <option value="PICKUP_TRUCK">Pickup Truck</option>
                <option value="CONTAINER_3TON">3-Ton Container</option>
              </select>
            </div>

            <div className="pt-2 flex gap-2">
              <button onClick={getQuote} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium transition">Get Quote</button>
              <button onClick={handleBooking} className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-medium transition">Book Now</button>
            </div>
            
            {quote && (
              <div className="bg-gray-50 p-4 rounded-md border border-gray-100 space-y-1">
                <p className="text-sm text-gray-600">Volumetric Weight: <span className="font-semibold text-gray-800">{quote.volumetric} kg</span></p>
                <p className="text-sm text-gray-600">Chargeable Weight: <span className="font-semibold text-gray-800">{quote.chargeable} kg</span></p>
                <p className="text-lg font-bold text-green-600">Estimated Price: ₹{quote.estimated}</p>
              </div>
            )}
          </div>

          {/* Interactive Map Column */}
          <div className="flex flex-col space-y-2">
            <label className="block text-sm font-medium text-gray-700">Visual Location Selection (Drag markers to set coordinates)</label>
            <div className="h-80 lg:h-full rounded-lg overflow-hidden border shadow-sm relative min-h-[300px]">
              <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <ChangeMapView center={mapCenter} />
                <Marker 
                  position={[form.pickupLat, form.pickupLng]} 
                  draggable={true} 
                  eventHandlers={pickupHandlers} 
                  ref={pickupMarkerRef}
                >
                  <Popup>Pickup Location (Draggable)</Popup>
                </Marker>
                <Marker 
                  position={[form.dropoffLat, form.dropoffLng]} 
                  draggable={true} 
                  eventHandlers={dropoffHandlers} 
                  ref={dropoffMarkerRef}
                >
                  <Popup>Dropoff Location (Draggable)</Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">My Bookings</h3>
        <button onClick={fetchMyBookings} className="mb-4 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition">Refresh</button>
        <div className="space-y-2">
          {bookings.map((b: any) => (
            <div key={b.id} className="border p-3 rounded flex justify-between items-center hover:bg-gray-50 transition">
              <div>
                <p className="font-medium">{b.cargoType} — {b.status}</p>
                <p className="text-sm text-gray-500">₹{b.price} | OTP: {b.pickupOTP}</p>
              </div>
              <button onClick={() => navigate(`/track/${b.id}`)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition">
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
