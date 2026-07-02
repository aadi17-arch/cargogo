import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBooking } from '@/hooks/useBooking';
import { useSocket, useSocketListener } from '@/hooks/useSocket';
import PaymentModal from '@/components/dashboard/PaymentModal';
import StatusBadge from '@/components/ui/StatusBadge';
import AddressSearchInput from '@/components/booking/AddressSearchInput';
import MapView, { MapMarker } from '@/components/map/MapView';
import { calculateQuote, QuoteResult } from '@/utils/pricing';
import { formatPrice, formatDate } from '@/utils/formatters';
import { toast } from 'react-hot-toast';
import { geocodingService } from '@/services/geocoding.service';
import { LayoutGrid, ClipboardList, MapPin } from 'lucide-react';

function ShipperDashboard() {
  const { token } = useAuth();
  const { bookings, fetchMyBookings, createBooking: apiCreateBooking, cancelBooking } = useBooking();
  const { bookCargo } = useSocket(token);
  const navigate = useNavigate();

  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<any | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Tabs state: 'book' | 'list'
  const [activeTab, setActiveTab] = useState<'book' | 'list'>('book');

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
  const [quote, setQuote] = useState<QuoteResult | null>(null);

  const [pickupSearch, setPickupSearch] = useState('');
  const [dropoffSearch, setDropoffSearch] = useState('');
  const [pickupResults, setPickupResults] = useState<any[]>([]);
  const [dropoffResults, setDropoffResults] = useState<any[]>([]);
  const [searchingPickup, setSearchingPickup] = useState(false);
  const [searchingDropoff, setSearchingDropoff] = useState(false);

  const pickupMarkerRef = useRef<any>(null);
  const dropoffMarkerRef = useRef<any>(null);

  const reverseGeocode = async (lat: number, lng: number, type: 'pickup' | 'dropoff') => {
    try {
      const data = await geocodingService.reverse(lat, lng);
      if (data?.display_name) {
        if (type === 'pickup') { setPickupSearch(data.display_name); setForm(prev => ({ ...prev, pickupAddress: data.display_name })); }
        else                   { setDropoffSearch(data.display_name); setForm(prev => ({ ...prev, dropoffAddress: data.display_name })); }
      }
    } catch (e) { console.error(e); }
  };

  const searchAddress = async (query: string, type: 'pickup' | 'dropoff') => {
    if (!query.trim()) return;
    if (type === 'pickup') setSearchingPickup(true); else setSearchingDropoff(true);
    try {
      const data = await geocodingService.search(query);
      if (Array.isArray(data) && data.length > 0) {
        if (type === 'pickup') setPickupResults(data); else setDropoffResults(data);
        return;
      }
      throw new Error('No results from geocoding service');
    } catch (e) {
      console.warn('Geocoding search failed:', e);
      if (type === 'pickup') setPickupResults([]); else setDropoffResults([]);
    } finally {
      if (type === 'pickup') setSearchingPickup(false); else setSearchingDropoff(false);
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

  const locateMe = () => {
    if (!navigator.geolocation) { toast.error('Geolocation is not supported by your browser'); return; }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        setForm(prev => ({ ...prev, pickupLat: lat, pickupLng: lng }));
        reverseGeocode(lat, lng, 'pickup');
      },
      () => toast.error('Could not retrieve your location. Please check browser permissions.')
    );
  };

  useEffect(() => { fetchMyBookings(); }, []);

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
    setQuote(calculateQuote({
      pickupLat: form.pickupLat!, pickupLng: form.pickupLng!,
      dropoffLat: form.dropoffLat!, dropoffLng: form.dropoffLng!,
      weightKg: form.weightKg, lengthCm: form.lengthCm,
      widthCm: form.widthCm, heightCm: form.heightCm,
      vehicleType: form.vehicleType,
    }));
  };

  const handleBooking = async () => {
    if (form.pickupLat === null || form.pickupLng === null || form.dropoffLat === null || form.dropoffLng === null) {
      toast.error('Please select both From and To locations first.'); return;
    }
    if (!form.pickupAddress || !form.dropoffAddress) {
      toast.error('Please select valid addresses from the search dropdown.'); return;
    }
    setBookingLoading(true);
    try {
      const booking = await apiCreateBooking(form as any);
      toast.success('Booking created! ID: ' + booking.id);
      bookCargo(booking.id);
      fetchMyBookings();
      setActiveTab('list'); // Switch to booking list automatically
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create booking');
    } finally { setBookingLoading(false); }
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
    : [19.0760, 72.8777];

  const mapMarkers = useMemo(() => {
    const markersList: MapMarker[] = [];
    if (form.pickupLat !== null && form.pickupLng !== null) {
      markersList.push({
        lat: form.pickupLat,
        lng: form.pickupLng,
        popupText: 'Pickup (Drag me)',
        draggable: true,
        onDragEnd: (lat, lng) => {
          setForm(prev => ({ ...prev, pickupLat: lat, pickupLng: lng }));
          reverseGeocode(lat, lng, 'pickup');
        },
        markerRef: pickupMarkerRef
      });
    }
    if (form.dropoffLat !== null && form.dropoffLng !== null) {
      markersList.push({
        lat: form.dropoffLat,
        lng: form.dropoffLng,
        popupText: 'Drop-off (Drag me)',
        draggable: true,
        onDragEnd: (lat, lng) => {
          setForm(prev => ({ ...prev, dropoffLat: lat, dropoffLng: lng }));
          reverseGeocode(lat, lng, 'dropoff');
        },
        markerRef: dropoffMarkerRef
      });
    }
    return markersList;
  }, [form.pickupLat, form.pickupLng, form.dropoffLat, form.dropoffLng]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 font-heading">
          Shipper Dashboard
        </h2>
        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('book')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'book'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutGrid size={14} />
            Book Delivery
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'list'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardList size={14} />
            My Bookings ({bookings.length})
          </button>
        </div>
      </div>

      {activeTab === 'book' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Top Full Width Map on Desktop/Tablet inside form view */}
          <div className="lg:col-span-12 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1 font-medium font-body">
                <MapPin size={14} className="text-indigo-500" />
                Select cargo endpoints by searching addresses or dragging pins
              </span>
              <button 
                type="button" 
                onClick={locateMe} 
                className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"
              >
                My Location
              </button>
            </div>
            
            <div className="h-64 sm:h-80 w-full overflow-hidden border border-slate-200 rounded-xl shadow-sm">
              <MapView center={mapCenter} zoom={12} markers={mapMarkers} />
            </div>
          </div>

          {/* Bottom Columns: Form & Info */}
          <div className="lg:col-span-8 p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-800 font-heading">
              Shipment Specifications
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Form Inputs */}
              <div className="space-y-4">
                <AddressSearchInput
                  label="Pickup Location"
                  placeholder="Type pickup address..."
                  value={pickupSearch}
                  results={pickupResults}
                  searching={searchingPickup}
                  onChange={setPickupSearch}
                  onSearch={() => searchAddress(pickupSearch, 'pickup')}
                  onSelect={(r) => handleSelectResult(r, 'pickup')}
                />

                <AddressSearchInput
                  label="Delivery Location"
                  placeholder="Type drop-off address..."
                  value={dropoffSearch}
                  results={dropoffResults}
                  searching={searchingDropoff}
                  onChange={setDropoffSearch}
                  onSearch={() => searchAddress(dropoffSearch, 'dropoff')}
                  onSelect={(r) => handleSelectResult(r, 'dropoff')}
                />
              </div>

              {/* Right Form Cargo Details */}
              <div className="p-4 space-y-4 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Cargo Parameters
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Cargo Type</label>
                    <input 
                      placeholder="e.g. Electronics" 
                      value={form.cargoType} 
                      onChange={(e) => setForm({ ...form, cargoType: e.target.value })} 
                      className="input-field" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Weight</label>
                    <div className="relative flex items-center">
                      <input 
                        type="number" 
                        value={form.weightKg} 
                        onChange={(e) => setForm({ ...form, weightKg: +e.target.value })} 
                        className="input-field pr-10" 
                      />
                      <span className="absolute right-3 text-xs font-bold text-slate-400 select-none">kg</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Dimensions</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { key: 'lengthCm', label: 'L', placeholder: 'Length' },
                      { key: 'widthCm',  label: 'W', placeholder: 'Width'  },
                      { key: 'heightCm', label: 'H', placeholder: 'Height' },
                    ] as const).map(({ key, label, placeholder }) => (
                      <div key={key} className="relative flex items-center">
                        <input 
                          type="number" 
                          value={form[key]} 
                          onChange={(e) => setForm({ ...form, [key]: +e.target.value })} 
                          className="input-field pr-8" 
                          placeholder={placeholder}
                        />
                        <span className="absolute right-2.5 text-[9px] font-bold text-slate-400 select-none">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Vehicle Selection</label>
                  <select 
                    value={form.vehicleType} 
                    onChange={(e) => setForm({ ...form, vehicleType: e.target.value as any })} 
                    className="input-field"
                  >
                    <option value="MINI_TEMPO">Mini Tempo</option>
                    <option value="PICKUP_TRUCK">Pickup Truck</option>
                    <option value="CONTAINER_3TON">3-Ton Container</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={getQuote} 
                className="flex-1 bg-transparent hover:bg-slate-50 text-indigo-600 border border-indigo-600/30 rounded-xl py-3 font-bold text-xs transition-colors shadow-sm"
              >
                Get Price Quote
              </button>
              <button 
                onClick={handleBooking} 
                disabled={bookingLoading} 
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 font-bold text-xs transition-all disabled:opacity-50 shadow-sm"
              >
                {bookingLoading ? 'Booking...' : 'Book Now'}
              </button>
            </div>
          </div>

          {/* Pricing Quote Column */}
          <div className="lg:col-span-4 space-y-4">
            {quote ? (
              <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4 text-xs font-body text-slate-600">
                <p className="font-mono text-[9px] font-bold tracking-wider uppercase text-slate-400">
                  Fare Pricing Summary
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Distance:</span>
                    <span className="font-bold text-slate-800">{quote.distanceKm} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Chargeable weight:</span>
                    <span className="font-bold text-slate-800">{quote.chargeable} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Base Fare:</span>
                    <span className="font-bold text-slate-800">{formatPrice(quote.basePrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Per Km Rate:</span>
                    <span className="font-bold text-slate-800">₹{quote.pricePerKm}/km</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Per Kg Rate:</span>
                    <span className="font-bold text-slate-800">₹{quote.costPerUnit}/kg</span>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-800 font-heading">Total Estimate:</span>
                  <span className="text-2xl font-black text-indigo-600 font-heading">{formatPrice(quote.estimated)}</span>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 border border-slate-200 border-dashed rounded-xl flex flex-col items-center justify-center text-center h-48 text-slate-400">
                <p className="text-xs font-medium">Input cargo details and click "Get Price Quote" to review fare details</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* My Bookings Tab */
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <h3 className="text-lg font-bold text-slate-800 font-heading">
              Shipment Manifest
            </h3>
            <button 
              onClick={fetchMyBookings} 
              className="px-3.5 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors shadow-sm"
            >
              Refresh
            </button>
          </div>

          {bookings.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {bookings.map((b: any) => (
                <div key={b.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition">
                  <div className="space-y-1.5 flex-1 min-w-0 font-body">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-800 truncate text-sm">{b.cargoType}</span>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="text-xs font-medium text-slate-500">
                      Price: <span className="font-bold text-indigo-600 font-mono">{formatPrice(b.price)}</span>
                      {b.status === 'ACCEPTED'   && ` | Pickup OTP: ${b.pickupOTP}`}
                      {b.status === 'IN_TRANSIT' && ` | Dropoff OTP: ${b.dropoffOTP}`}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">{formatDate(b.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {['PENDING', 'ACCEPTED'].includes(b.status) && (
                      <button 
                        onClick={() => handleCancelBooking(b.id)} 
                        className="px-3.5 py-2 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-bold rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    {b.status === 'DELIVERED' && (
                      <button 
                        onClick={() => setSelectedBookingForPayment(b)} 
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                      >
                        Pay
                      </button>
                    )}
                    <button 
                      onClick={() => navigate(`/track/${b.id}`)} 
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                    >
                      {['DELIVERED', 'COMPLETED'].includes(b.status) ? 'Details' : 'Track'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <ClipboardList size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-medium">No bookings found</p>
              <button 
                onClick={() => setActiveTab('book')}
                className="mt-3 text-xs font-bold text-indigo-600 hover:underline"
              >
                Create your first delivery booking
              </button>
            </div>
          )}
        </div>
      )}

      {selectedBookingForPayment && (
        <PaymentModal
          booking={selectedBookingForPayment}
          onClose={() => setSelectedBookingForPayment(null)}
          onSuccess={() => { setSelectedBookingForPayment(null); fetchMyBookings(); }}
        />
      )}
    </div>
  );
}

export default ShipperDashboard;
