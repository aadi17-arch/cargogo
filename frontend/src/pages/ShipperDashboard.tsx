import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBooking } from '@/hooks/useBooking';
import { useSocket, useSocketListener } from '@/hooks/useSocket';
import PaymentModal from '@/components/dashboard/PaymentModal';
import { toast } from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { geocodingService } from '@/services/geocoding.service';
import { calculateDistance } from '@/utils/geo';


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
  const { bookCargo } = useSocket(token);
  const navigate = useNavigate();

  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<any | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [form, setForm] = useState({
    pickupLat: null as number | null,
    pickupLng: null as number | null,
    pickupAddress: '',
    dropoffLat: null as number | null,
    dropoffLng: null as number | null,
    dropoffAddress: '',
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

      const data = await geocodingService.reverse(lat,lng);
      if (data && data.display_name) {
        if (type === 'pickup') {
          setPickupSearch(data.display_name);
          setForm(prev => ({ ...prev, pickupAddress: data.display_name }));
        } else {
          setDropoffSearch(data.display_name);
          setForm(prev => ({ ...prev, dropoffAddress: data.display_name }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Geocoding Search
  const searchAddress = async (query: string, type: 'pickup' | 'dropoff') => {
    if (!query.trim()) return;
    if (type === 'pickup') setSearchingPickup(true);
    else setSearchingDropoff(true);

    try {
      const data = await geocodingService.search(query);
      if (Array.isArray(data) && data.length > 0) {
        if (type === 'pickup') setPickupResults(data);
        else setDropoffResults(data);
        return;
      }
      throw new Error('No results from geocoding service');
    } catch (e) {
      console.warn('Geocoding search failed:', e);
      if (type === 'pickup') {
        setPickupResults([]);
      } else {
        setDropoffResults([]);
      }
    } finally {
      if (type === 'pickup') setSearchingPickup(false);
      else setSearchingDropoff(false);
    }
  };

  const handleSelectResult = (result: any, type: 'pickup' | 'dropoff') => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    if (type === 'pickup') {
      setForm(prev => ({ ...prev, pickupLat: lat, pickupLng: lng, pickupAddress: result.display_name }));
      setPickupSearch(result.display_name);
      setPickupResults([]);
    } else {
      setForm(prev => ({ ...prev, dropoffLat: lat, dropoffLng: lng, dropoffAddress: result.display_name }));
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
      toast.error('Geolocation is not supported by your browser');
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
        toast.error('Could not retrieve your location. Please check browser permissions.');
      }
    );
  };

  useEffect(() => {
    fetchMyBookings();
  }, []);

  useSocketListener('booking-accepted', (data: any) => {
    toast.success(`Driver ${data.driverName} has accepted your booking!`);
    fetchMyBookings();
  });

  useSocketListener('no-drivers', (data: any) => {
    toast.error(`Driver matching update: ${data.message}`);
    fetchMyBookings();
  });


  const getQuote = async () => {
    if (form.pickupLat === null || form.pickupLng === null || form.dropoffLat === null || form.dropoffLng === null) {
      toast.error('Please select both From and To locations to calculate the price.');
      return;
    }

    const distanceKm = calculateDistance(form.pickupLat, form.pickupLng, form.dropoffLat, form.dropoffLng);
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
      toast.error('Please select both From and To locations first.');
      return;
    }
    if (!form.pickupAddress || !form.dropoffAddress) {
      toast.error('Please select valid addresses from the search dropdown.');
      return;
    }
    setBookingLoading(true);
    try {
      const booking = await apiCreateBooking(form as any);
      toast.success('Booking created! ID: ' + booking.id);
      bookCargo(booking.id);
      fetchMyBookings();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create booking');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelBooking = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await cancelBooking(id);
      toast.success('Booking cancelled successfully.');
      fetchMyBookings();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to cancel booking');
    }
  };



  const mapCenter: [number, number] = (form.pickupLat !== null && form.pickupLng !== null)
    ? [form.pickupLat, form.pickupLng]
    : [19.0760, 72.8777]; // Center on Mumbai by default if no location is selected yet

  return (
    <div className="space-y-6">
      <h2 className="text-[24px] font-bold tracking-tight" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>Shipper Dashboard</h2>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left Column: Form & Map */}
        <div className="xl:col-span-2 p-6 shadow-none" style={{ backgroundColor: 'var(--color-card)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--radius-card)' }}>
          <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>Book a Delivery</h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Fields Column */}
          <div className="space-y-4">

            {/* Pickup Address Search Input */}
            <div className="relative">
              <label className="block text-[10px] font-extrabold mb-1 tracking-tight uppercase" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)' }}>Pickup Location</label>
              <div className="flex items-center gap-2">
                <input
                  placeholder="Type pickup address..."
                  value={pickupSearch}
                  onChange={(e) => setPickupSearch(e.target.value)}
                  className="input-field flex-1 tracking-tight"
                  style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-body)' }}
                />
                <button
                  type="button"
                  onClick={() => searchAddress(pickupSearch, 'pickup')}
                  className="text-white px-4 py-3 text-sm font-bold transition whitespace-nowrap shrink-0"
                  style={{ backgroundColor: 'var(--color-primary)', borderRadius: 'var(--radius-button)', fontFamily: 'var(--font-heading)' }}
                >
                  Search
                </button>
              </div>
              {searchingPickup && <p className="text-xs font-medium mt-1" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>Searching...</p>}
              {pickupResults.length > 0 && (
                <div className="absolute z-[1000] w-full mt-1 max-h-48 overflow-y-auto" style={{ backgroundColor: 'var(--color-card)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--radius-card)' }}>
                  {pickupResults.map((r, i) => (
                    <button
                       key={i}
                       type="button"
                       onClick={() => handleSelectResult(r, 'pickup')}
                       className="w-full text-left p-2.5 hover:bg-[var(--color-background)] text-xs border-b last:border-b-0 block truncate"
                       style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-main)', fontFamily: 'var(--font-body)' }}
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
                className="px-3 py-1.5 text-xs font-bold flex items-center gap-1 transition-all hover:bg-[var(--color-background)]"
                style={{
                  backgroundColor: 'var(--color-card)',
                  color: 'var(--color-text-muted)',
                  border: 'var(--border-width) solid var(--color-input-border)',
                  borderRadius: 'var(--radius-button)',
                  fontFamily: 'var(--font-heading)'
                }}
              >
                My Location
              </button>
            </div>

            {/* Drop-off Address Search Input */}
            <div className="relative">
              <label className="block text-[10px] font-extrabold mb-1 tracking-tight uppercase" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)' }}>Delivery Location</label>
              <div className="flex items-center gap-2">
                <input
                  placeholder="Type drop-off address..."
                  value={dropoffSearch}
                  onChange={(e) => setDropoffSearch(e.target.value)}
                  className="input-field flex-1 tracking-tight"
                  style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-body)' }}
                />
                <button
                  type="button"
                  onClick={() => searchAddress(dropoffSearch, 'dropoff')}
                  className="text-white px-4 py-3 text-sm font-bold transition whitespace-nowrap shrink-0"
                  style={{ backgroundColor: 'var(--color-primary)', borderRadius: 'var(--radius-button)', fontFamily: 'var(--font-heading)' }}
                >
                  Search
                </button>
              </div>
              {searchingDropoff && <p className="text-xs font-medium mt-1" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>Searching...</p>}
              {dropoffResults.length > 0 && (
                <div className="absolute z-[1000] w-full mt-1 max-h-48 overflow-y-auto" style={{ backgroundColor: 'var(--color-card)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--radius-card)' }}>
                  {dropoffResults.map((r, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectResult(r, 'dropoff')}
                      className="w-full text-left p-2.5 hover:bg-[var(--color-background)] text-xs border-b last:border-b-0 block truncate"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-main)', fontFamily: 'var(--font-body)' }}
                    >
                      {r.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <hr className="my-2" style={{ borderColor: 'var(--color-border)' }} />

            {/* Cargo Information Group */}
            <div className="p-4 space-y-4 tracking-tight" style={{ backgroundColor: 'var(--color-background)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--radius-card)', fontFamily: 'var(--font-body)' }}>
              <h4 className="text-xs font-extrabold tracking-tight uppercase" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>Cargo Details</h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold mb-1 tracking-tight" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)' }}>Cargo Type</label>
                  <input placeholder="e.g. Electronics" value={form.cargoType} onChange={(e) => setForm({...form, cargoType: e.target.value})} className="input-field tracking-tight" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-body)' }} />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold mb-1 tracking-tight" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)' }}>Weight</label>
                  <div className="relative flex items-center">
                    <input placeholder="Weight" type="number" value={form.weightKg} onChange={(e) => setForm({...form, weightKg: +e.target.value})} className="input-field pr-10 tracking-tight" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-body)' }} />
                    <span className="absolute right-3 text-xs font-extrabold pointer-events-none select-none tracking-tight" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)' }}>kg</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold mb-1 tracking-tight" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)' }}>Dimensions</label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="relative flex items-center">
                    <input placeholder="Length" type="number" value={form.lengthCm} onChange={(e) => setForm({...form, lengthCm: +e.target.value})} className="input-field pr-12 tracking-tight" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-body)' }} />
                    <span className="absolute right-3 text-[10px] font-extrabold pointer-events-none select-none tracking-tight" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)' }}>L (cm)</span>
                  </div>
                  <div className="relative flex items-center">
                    <input placeholder="Width" type="number" value={form.widthCm} onChange={(e) => setForm({...form, widthCm: +e.target.value})} className="input-field pr-12 tracking-tight" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-body)' }} />
                    <span className="absolute right-3 text-[10px] font-extrabold pointer-events-none select-none tracking-tight" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)' }}>W (cm)</span>
                  </div>
                  <div className="relative flex items-center">
                    <input placeholder="Height" type="number" value={form.heightCm} onChange={(e) => setForm({...form, heightCm: +e.target.value})} className="input-field pr-12 tracking-tight" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-body)' }} />
                    <span className="absolute right-3 text-[10px] font-extrabold pointer-events-none select-none tracking-tight" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)' }}>H (cm)</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold mb-1 tracking-tight" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)' }}>Vehicle Selection</label>
                <select value={form.vehicleType} onChange={(e) => setForm({...form, vehicleType: e.target.value as any})} className="input-field tracking-tight" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-body)' }}>
                  <option value="MINI_TEMPO">Mini Tempo</option>
                  <option value="PICKUP_TRUCK">Pickup Truck</option>
                  <option value="CONTAINER_3TON">3-Ton Container</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={getQuote}
                className="flex-1 bg-transparent px-4 py-3 font-bold transition text-sm hover:bg-[var(--color-background)]"
                style={{
                  color: 'var(--color-primary)',
                  border: 'var(--border-width) solid var(--color-primary)',
                  borderRadius: 'var(--radius-button)',
                  fontFamily: 'var(--font-heading)'
                }}
              >
                Get Price
              </button>
              <button
                onClick={handleBooking}
                disabled={bookingLoading}
                className="flex-1 text-white px-4 py-3 font-bold transition text-sm hover:opacity-90 disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  borderRadius: 'var(--radius-button)',
                  fontFamily: 'var(--font-heading)'
                }}
              >
                {bookingLoading ? 'Booking...' : 'Book Now'}
              </button>
            </div>

            {quote && (
              <div className="space-y-2 text-xs" style={{ backgroundColor: 'var(--color-background)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--radius-card)', padding: '16px', fontFamily: 'var(--font-body)' }}>
                <p className="tracking-[0.08em] text-[10px]" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>Pricing Breakdown Scheme</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1" style={{ color: 'var(--color-text-main)' }}>
                  <p>Distance: <span className="font-bold">{quote.distanceKm} km</span></p>
                  <p>Billed Weight: <span className="font-bold">{quote.chargeable} kg</span></p>
                  <p>Base Fare: <span className="font-bold">₹{quote.basePrice}</span></p>
                  <p>Distance Rate: <span className="font-bold">₹{quote.pricePerKm}/km</span></p>
                  <p>Weight Rate: <span className="font-bold">₹{quote.costPerUnit}/kg</span></p>
                </div>
                <div className="border-t pt-2 flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
                  <span className="text-sm font-bold" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>Total Price Estimate:</span>
                  <span className="text-2xl font-bold" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-heading)' }}>₹{Math.round(quote.estimated)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Map Column */}
          <div className="flex flex-col space-y-2">
            <label className="block text-[10px] font-bold tracking-[0.08em]" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>Drag map pins to select locations</label>
            <div className="h-80 lg:h-full overflow-hidden shadow-none relative min-h-[300px]" style={{ isolation: 'isolate', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--radius-card)' }}>
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

        {/* Right Column: My Bookings Feed */}
        <div className="p-6 shadow-none" style={{ backgroundColor: 'var(--color-card)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--radius-card)' }}>
          <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>My Bookings</h3>
        <button
          onClick={fetchMyBookings}
          className="mb-4 px-4 py-2 text-sm font-semibold transition-all hover:bg-[var(--color-background)]"
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
        <div className="space-y-2">
        <div className="divide-y divide-[var(--color-border)]">
          {bookings.map((b: any) => (
            <div key={b.id} className="py-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 transition">
              <div className="space-y-1.5 flex-1 w-full" style={{ fontFamily: 'var(--font-body)' }}>
                <div className="flex items-center justify-between gap-2 mb-1 w-full">
                  <span className="font-semibold text-[var(--color-text-main)]">{b.cargoType}</span>
                  <span
                    className="px-2 py-0.5 rounded-[4px] text-[10px] font-bold tracking-wide uppercase border-[1.5px] bg-transparent shrink-0"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      borderColor:
                        b.status === 'PENDING' ? 'var(--color-status-pending)' :
                        b.status === 'ACCEPTED' ? 'var(--color-status-accepted)' :
                        b.status === 'IN_TRANSIT' ? 'var(--color-status-transit)' :
                        b.status === 'DELIVERED' ? 'var(--color-status-delivered)' :
                        b.status === 'COMPLETED' ? 'var(--color-status-completed)' :
                        b.status === 'CANCELLED' ? 'var(--color-status-cancelled)' : 'var(--color-text-muted)',
                      color:
                        b.status === 'PENDING' ? 'var(--color-status-pending)' :
                        b.status === 'ACCEPTED' ? 'var(--color-status-accepted)' :
                        b.status === 'IN_TRANSIT' ? 'var(--color-status-transit)' :
                        b.status === 'DELIVERED' ? 'var(--color-status-delivered)' :
                        b.status === 'COMPLETED' ? 'var(--color-status-completed)' :
                        b.status === 'CANCELLED' ? 'var(--color-status-cancelled)' : 'var(--color-text-muted)'
                    }}
                  >
                    {b.status}
                  </span>
                </div>
                <p className="text-xs font-medium text-[var(--color-text-muted)] leading-relaxed">
                  Price: <span className="font-semibold text-[var(--color-primary)]">₹{b.price}</span>
                  {b.status === 'ACCEPTED' && ` | Pickup OTP: ${b.pickupOTP}`}
                  {b.status === 'IN_TRANSIT' && ` | Dropoff OTP: ${b.dropoffOTP}`}
                </p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto justify-end shrink-0">
                {['PENDING', 'ACCEPTED'].includes(b.status) && (
                  <button
                    onClick={() => handleCancelBooking(b.id)}
                    className="bg-transparent text-[var(--color-status-cancelled)] px-3.5 py-2 text-xs font-bold hover:bg-[#FEF2F2] transition-all"
                    style={{ border: 'var(--border-width) solid var(--color-status-cancelled)', borderRadius: 'var(--radius-button)', fontFamily: 'var(--font-heading)' }}
                  >
                    Cancel
                  </button>
                )}
                {b.status === 'DELIVERED' && (
                  <button
                    onClick={() => setSelectedBookingForPayment(b)}
                    className="text-white px-3.5 py-2 text-xs font-bold hover:opacity-90 transition"
                    style={{ backgroundColor: 'var(--color-primary)', borderRadius: 'var(--radius-button)', fontFamily: 'var(--font-heading)' }}
                  >
                    Pay
                  </button>
                )}
                <button
                  onClick={() => navigate(`/track/${b.id}`)}
                  className="text-white px-3.5 py-2 text-xs font-bold hover:opacity-90 transition"
                  style={{ backgroundColor: 'var(--color-primary)', borderRadius: 'var(--radius-button)', fontFamily: 'var(--font-heading)' }}
                >
                  {['DELIVERED', 'COMPLETED'].includes(b.status) ? 'Details' : 'Track'}
                </button>
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>
      </div>

      {selectedBookingForPayment && (
        <PaymentModal
          booking={selectedBookingForPayment}
          onClose={() => setSelectedBookingForPayment(null)}
          onSuccess={() => {
            setSelectedBookingForPayment(null);
            fetchMyBookings();
          }}
        />
      )}
    </div>
  );
}

export default ShipperDashboard;
