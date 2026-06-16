import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBooking } from '@/hooks/useBooking';
import { useSocket } from '@/hooks/useSocket';
import { paymentService } from '@/services/payment.service';
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
  const { bookings, fetchMyBookings, createBooking: apiCreateBooking, cancelBooking } = useBooking();
  const { bookCargo, on } = useSocket(token);
  const navigate = useNavigate();

  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [processingPayment, setProcessingPayment] = useState(false);

  const [form, setForm] = useState({
    pickupLat: null as number | null,
    pickupLng: null as number | null,
    dropoffLat: null as number | null,
    dropoffLng: null as number | null,
    cargoType: 'Electronics',
    weightKg: 50,
    lengthCm: 100,
    widthCm: 60,
    heightCm: 40,
    vehicleType: 'MINI_TEMPO' as 'MINI_TEMPO' | 'PICKUP_TRUCK' | 'CONTAINER_3TON'
  });
  const [quote, setQuote] = useState<any>(null);

  // Address lookup state
  const [pickupSearch, setPickupSearch] = useState('');
  const [dropoffSearch, setDropoffSearch] = useState('');
  const [pickupResults, setPickupResults] = useState<any[]>([]);
  const [dropoffResults, setDropoffResults] = useState<any[]>([]);
  const [searchingPickup, setSearchingPickup] = useState(false);
  const [searchingDropoff, setSearchingDropoff] = useState(false);

  const pickupMarkerRef = useRef<any>(null);
  const dropoffMarkerRef = useRef<any>(null);

  // Reverse Geocoding
  const reverseGeocode = async (lat: number, lng: number, type: 'pickup' | 'dropoff') => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&email=cargogo-dev@example.com`);
      const data = await res.json();
      if (data && data.display_name) {
        if (type === 'pickup') {
          setPickupSearch(data.display_name);
        } else {
          setDropoffSearch(data.display_name);
        }
      }
    } catch (e) {
      console.error('Reverse geocoding error:', e);
    }
  };

  // Geocoding Search
  const searchAddress = async (query: string, type: 'pickup' | 'dropoff') => {
    if (!query.trim()) return;
    if (type === 'pickup') setSearchingPickup(true);
    else setSearchingDropoff(true);

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&email=cargogo-dev@example.com`);
      const data = await res.json();
      if (type === 'pickup') {
        setPickupResults(data);
      } else {
        setDropoffResults(data);
      }
    } catch (e) {
      console.error('Geocoding search error:', e);
    } finally {
      if (type === 'pickup') setSearchingPickup(false);
      else setSearchingDropoff(false);
    }
  };

  const handleSelectResult = (result: any, type: 'pickup' | 'dropoff') => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    if (type === 'pickup') {
      setForm(prev => ({ ...prev, pickupLat: lat, pickupLng: lng }));
      setPickupSearch(result.display_name);
      setPickupResults([]);
    } else {
      setForm(prev => ({ ...prev, dropoffLat: lat, dropoffLng: lng }));
      setDropoffSearch(result.display_name);
      setDropoffResults([]);
    }
  };

  const pickupHandlers = useMemo(
    () => ({
      dragend() {
        const marker = pickupMarkerRef.current;
        if (marker != null) {
          const position = marker.getLatLng();
          const lat = Number(position.lat.toFixed(6));
          const lng = Number(position.lng.toFixed(6));
          setForm(prev => ({ ...prev, pickupLat: lat, pickupLng: lng }));
          reverseGeocode(lat, lng, 'pickup');
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
          const lat = Number(position.lat.toFixed(6));
          const lng = Number(position.lng.toFixed(6));
          setForm(prev => ({ ...prev, dropoffLat: lat, dropoffLng: lng }));
          reverseGeocode(lat, lng, 'dropoff');
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
        const lat = Number(latitude.toFixed(6));
        const lng = Number(longitude.toFixed(6));
        setForm((prev) => ({
          ...prev,
          pickupLat: lat,
          pickupLng: lng,
        }));
        reverseGeocode(lat, lng, 'pickup');
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

  const getHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getQuote = async () => {
    if (form.pickupLat === null || form.pickupLng === null || form.dropoffLat === null || form.dropoffLng === null) {
      alert('Please select both From and To locations to calculate the price.');
      return;
    }
    
    const distanceKm = getHaversineDistance(form.pickupLat, form.pickupLng, form.dropoffLat, form.dropoffLng);
    const volumetric = (form.lengthCm * form.widthCm * form.heightCm) / 5000;
    const chargeable = Math.max(form.weightKg, volumetric);

    const rates: Record<string, { basePrice: number; pricePerKm: number; costPerUnit: number }> = {
      MINI_TEMPO: { basePrice: 50, pricePerKm: 12, costPerUnit: 4 },
      PICKUP_TRUCK: { basePrice: 80, pricePerKm: 15, costPerUnit: 5 },
      CONTAINER_3TON: { basePrice: 150, pricePerKm: 20, costPerUnit: 7 },
    };

    const rate = rates[form.vehicleType] || rates.MINI_TEMPO;
    const price = rate.basePrice + (rate.pricePerKm * distanceKm) + (rate.costPerUnit * chargeable);

    setQuote({
      distanceKm: Math.round(distanceKm * 100) / 100,
      volumetric: Math.round(volumetric * 100) / 100,
      chargeable: Math.round(chargeable * 100) / 100,
      basePrice: rate.basePrice,
      pricePerKm: rate.pricePerKm,
      costPerUnit: rate.costPerUnit,
      estimated: Math.round(price * 100) / 100
    });
  };

  const handleBooking = async () => {
    if (form.pickupLat === null || form.pickupLng === null || form.dropoffLat === null || form.dropoffLng === null) {
      alert('Please select both From and To locations first.');
      return;
    }
    try {
      const booking = await apiCreateBooking(form as any);
      alert('Booking created! ID: ' + booking.id);
      bookCargo(booking.id);
      fetchMyBookings();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to create booking');
    }
  };

  const handleCancelBooking = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await cancelBooking(id);
      alert('Booking cancelled successfully.');
      fetchMyBookings();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedBookingForPayment) return;
    setProcessingPayment(true);
    try {
      await paymentService.processCheckout(
        selectedBookingForPayment.id,
        paymentMethod,
        selectedBookingForPayment.price
      );
      alert('Payment successful! Booking completed.');
      setSelectedBookingForPayment(null);
      fetchMyBookings();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const mapCenter: [number, number] = (form.pickupLat !== null && form.pickupLng !== null) 
    ? [form.pickupLat, form.pickupLng] 
    : [19.0760, 72.8777]; // Center on Mumbai by default if no location is selected yet

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Shipper Dashboard</h2>
      
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Book a Delivery</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Fields Column */}
          <div className="space-y-4">
            
            {/* Pickup Address Search Input */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">From (Pickup Address)</label>
              <div className="flex gap-2">
                <input 
                  placeholder="Type pickup address..." 
                  value={pickupSearch} 
                  onChange={(e) => setPickupSearch(e.target.value)} 
                  className="input-field flex-1"
                />
                <button 
                  type="button"
                  onClick={() => searchAddress(pickupSearch, 'pickup')}
                  className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-black transition"
                >
                  Search
                </button>
              </div>
              {searchingPickup && <p className="text-xs text-gray-400 mt-1">Searching...</p>}
              {pickupResults.length > 0 && (
                <div className="absolute z-[1000] bg-white border border-gray-200 w-full rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {pickupResults.map((r, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectResult(r, 'pickup')}
                      className="w-full text-left p-2.5 hover:bg-gray-50 text-xs border-b last:border-b-0 border-gray-100 block truncate"
                    >
                      {r.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button 
                type="button" 
                onClick={locateMe}
                className="bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100 flex items-center gap-1 transition"
              >
                My Location
              </button>
            </div>

            {/* Drop-off Address Search Input */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">To (Drop-off Address)</label>
              <div className="flex gap-2">
                <input 
                  placeholder="Type drop-off address..." 
                  value={dropoffSearch} 
                  onChange={(e) => setDropoffSearch(e.target.value)} 
                  className="input-field flex-1"
                />
                <button 
                  type="button"
                  onClick={() => searchAddress(dropoffSearch, 'dropoff')}
                  className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-black transition"
                >
                  Search
                </button>
              </div>
              {searchingDropoff && <p className="text-xs text-gray-400 mt-1">Searching...</p>}
              {dropoffResults.length > 0 && (
                <div className="absolute z-[1000] bg-white border border-gray-200 w-full rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {dropoffResults.map((r, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectResult(r, 'dropoff')}
                      className="w-full text-left p-2.5 hover:bg-gray-50 text-xs border-b last:border-b-0 border-gray-100 block truncate"
                    >
                      {r.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <hr className="my-2 border-slate-100" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Cargo Type</label>
                <input placeholder="e.g. Electronics" value={form.cargoType} onChange={(e) => setForm({...form, cargoType: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Weight (kg)</label>
                <input placeholder="Weight" type="number" value={form.weightKg} onChange={(e) => setForm({...form, weightKg: +e.target.value})} className="input-field" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Length (cm)</label>
                <input placeholder="Length" type="number" value={form.lengthCm} onChange={(e) => setForm({...form, lengthCm: +e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Width (cm)</label>
                <input placeholder="Width" type="number" value={form.widthCm} onChange={(e) => setForm({...form, widthCm: +e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Height (cm)</label>
                <input placeholder="Height" type="number" value={form.heightCm} onChange={(e) => setForm({...form, heightCm: +e.target.value})} className="input-field" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Vehicle Type</label>
              <select value={form.vehicleType} onChange={(e) => setForm({...form, vehicleType: e.target.value as any})} className="input-field bg-white">
                <option value="MINI_TEMPO">Mini Tempo</option>
                <option value="PICKUP_TRUCK">Pickup Truck</option>
                <option value="CONTAINER_3TON">3-Ton Container</option>
              </select>
            </div>

            <div className="pt-2 flex gap-2">
              <button onClick={getQuote} className="flex-1 bg-slate-100 text-slate-800 px-4 py-2.5 rounded-xl hover:bg-slate-200 font-semibold transition">Get Price</button>
              <button onClick={handleBooking} className="flex-1 bg-slate-900 text-white px-4 py-2.5 rounded-xl hover:bg-black font-semibold transition">Book Now</button>
            </div>
            
            {quote && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
                <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Pricing Breakdown Scheme</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-700">
                  <p>Distance: <span className="font-bold">{quote.distanceKm} km</span></p>
                  <p>Billed Weight: <span className="font-bold">{quote.chargeable} kg</span></p>
                  <p>Base Fare: <span className="font-bold">₹{quote.basePrice}</span></p>
                  <p>Distance Rate: <span className="font-bold">₹{quote.pricePerKm}/km</span></p>
                  <p>Weight Rate: <span className="font-bold">₹{quote.costPerUnit}/kg</span></p>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-800">Total Price Estimate:</span>
                  <span className="text-lg font-bold text-green-600">₹{Math.round(quote.estimated)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Map Column */}
          <div className="flex flex-col space-y-2">
            <label className="block text-sm font-medium text-gray-700">Drag map pins to select locations</label>
            <div className="h-80 lg:h-full rounded-lg overflow-hidden border shadow-sm relative min-h-[300px]" style={{ isolation: 'isolate' }}>
              <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <ChangeMapView center={mapCenter} />
                {form.pickupLat !== null && form.pickupLng !== null && (
                  <Marker 
                    position={[form.pickupLat, form.pickupLng]} 
                    draggable={true} 
                    eventHandlers={pickupHandlers} 
                    ref={pickupMarkerRef}
                  >
                    <Popup>Pickup (Drag me)</Popup>
                  </Marker>
                )}
                {form.dropoffLat !== null && form.dropoffLng !== null && (
                  <Marker 
                    position={[form.dropoffLat, form.dropoffLng]} 
                    draggable={true} 
                    eventHandlers={dropoffHandlers} 
                    ref={dropoffMarkerRef}
                  >
                    <Popup>Drop-off (Drag me)</Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">My Bookings</h3>
        <button onClick={fetchMyBookings} className="mb-4 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-xl text-sm font-semibold transition">Refresh</button>
        <div className="space-y-2">
          {bookings.map((b: any) => (
            <div key={b.id} className="border p-3 rounded flex justify-between items-center hover:bg-gray-50 transition">
              <div>
                <p className="font-medium text-slate-800 flex items-center gap-2 mb-1">
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
                <p className="text-xs text-gray-500">
                  Price: ₹{b.price}
                  {b.status === 'ACCEPTED' && ` | Pickup OTP: ${b.pickupOTP}`}
                  {b.status === 'IN_TRANSIT' && ` | Dropoff OTP: ${b.dropoffOTP}`}
                </p>
              </div>
              <div className="flex gap-2">
                {['PENDING', 'ACCEPTED'].includes(b.status) && (
                  <button 
                    onClick={() => handleCancelBooking(b.id)} 
                    className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-700 transition"
                  >
                    Cancel
                  </button>
                )}
                {b.status === 'DELIVERED' && (
                  <button 
                    onClick={() => setSelectedBookingForPayment(b)} 
                    className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition"
                  >
                    Pay
                  </button>
                )}
                <button onClick={() => navigate(`/track/${b.id}`)} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                  Track
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedBookingForPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000] p-4">
          <div className="bg-white p-6 rounded-lg max-w-md w-full shadow-xl animate-fade-in">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Complete Payment</h3>
            <div className="space-y-3 mb-6">
              <p className="text-sm text-gray-600">Cargo: <span className="font-semibold text-gray-800">{selectedBookingForPayment.cargoType}</span></p>
              <p className="text-sm text-gray-600">Total Amount: <span className="font-bold text-green-600">₹{selectedBookingForPayment.price}</span></p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Payment Method</label>
                <select 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="UPI">UPI (Google Pay / PhonePe)</option>
                  <option value="NET_BANKING">Net Banking</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setSelectedBookingForPayment(null)} 
                disabled={processingPayment}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleProcessPayment} 
                disabled={processingPayment}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1"
              >
                {processingPayment ? 'Processing...' : `Pay ₹${selectedBookingForPayment.price}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShipperDashboard;
