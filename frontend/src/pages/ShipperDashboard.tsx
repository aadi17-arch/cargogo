import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBooking } from '@/hooks/useBooking';
import { useSocket, useSocketListener } from '@/hooks/useSocket';
import PaymentModal from '@/components/dashboard/PaymentModal';
import BaseModal from '@/components/ui/BaseModal';
import StatusBadge from '@/components/ui/StatusBadge';
import AddressSearchInput from '@/components/booking/AddressSearchInput';
import MapView, { MapMarker } from '@/components/map/MapView';
import TabNavigation from '@/components/ui/TabNavigation';
import EmptyState from '@/components/ui/EmptyState';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { calculateQuote, QuoteResult } from '@/utils/pricing';
import { formatPrice, formatDate } from '@/utils/formatters';
import { calculateDistance } from '@/utils/geo';
import { toast } from 'react-hot-toast';
import { geocodingService } from '@/services/geocoding.service';
import { BookingType } from '@/types/booking.types';
import { LayoutGrid, ClipboardList, MapPin, LocateFixed, Zap, CalendarClock, Truck, Clock, Copy } from 'lucide-react';

function ShipperDashboard() {
  const { token } = useAuth();
  const { bookings, fetchMyBookings, createBooking: apiCreateBooking, cancelBooking } = useBooking();
  const { bookCargo } = useSocket(token);
  const navigate = useNavigate();

  const getScheduledTimeRemaining = (scheduledAtStr: string) => {
    const diff = new Date(scheduledAtStr).getTime() - Date.now();
    if (diff <= 0) return 'Starts now';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `Starts in ${hours}h ${mins}m`;
    return `Starts in ${mins}m`;
  };

  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<any | null>(null);
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Tabs state: 'book' | 'list'
  const [activeTab, setActiveTab] = useState<'book' | 'list'>('book');

  // NEW: Scheduled booking state
  const [bookingType, setBookingType] = useState<BookingType>('INSTANT');
  const [scheduledAt, setScheduledAt] = useState<string>('');
  // Filter for the manifest/history tab
  const [manifestFilter, setManifestFilter] = useState<'all' | 'INSTANT' | 'SCHEDULED'>('all');

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
      const displayName = data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      if (type === 'pickup') {
        setPickupSearch(displayName);
        setPickupResults([]); // Clear search dropdown list immediately
        setForm(prev => ({ ...prev, pickupLat: lat, pickupLng: lng, pickupAddress: displayName }));
      } else {
        setDropoffSearch(displayName);
        setDropoffResults([]); // Clear search dropdown list immediately
        setForm(prev => ({ ...prev, dropoffLat: lat, dropoffLng: lng, dropoffAddress: displayName }));
      }
    } catch (e) {
      console.error(e);
      const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      if (type === 'pickup') {
        setPickupSearch(fallback);
        setPickupResults([]);
        setForm(prev => ({ ...prev, pickupLat: lat, pickupLng: lng, pickupAddress: fallback }));
      } else {
        setDropoffSearch(fallback);
        setDropoffResults([]);
        setForm(prev => ({ ...prev, dropoffLat: lat, dropoffLng: lng, dropoffAddress: fallback }));
      }
    }
  };

  const searchAddress = async (query: string, type: 'pickup' | 'dropoff') => {
    if (!query.trim() || query.length < 3) return;
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

  // Debounce pickup search on manual input change (skip if set via live location)
  useEffect(() => {
    if (!pickupSearch || pickupSearch.length < 3 || pickupSearch.startsWith('Locating') || pickupSearch.startsWith('Location (') || pickupSearch === form.pickupAddress) {
      setPickupResults([]);
      return;
    }
    const timer = setTimeout(() => {
      searchAddress(pickupSearch, 'pickup');
    }, 450);
    return () => clearTimeout(timer);
  }, [pickupSearch]);

  // Debounce dropoff search on input change (skip if selected from dropdown)
  useEffect(() => {
    if (!dropoffSearch || dropoffSearch.length < 3 || dropoffSearch === form.dropoffAddress) {
      setDropoffResults([]);
      return;
    }
    const timer = setTimeout(() => {
      searchAddress(dropoffSearch, 'dropoff');
    }, 450);
    return () => clearTimeout(timer);
  }, [dropoffSearch, form.dropoffAddress]);

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

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  const locateMe = () => {
    if (!navigator.geolocation) { toast.error('Geolocation is not supported by your browser'); return; }
    setPickupSearch('Locating current address...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        setUserLocation([lat, lng]);
        setForm(prev => ({ ...prev, pickupLat: lat, pickupLng: lng }));
        reverseGeocode(lat, lng, 'pickup');
      },
      () => toast.error('Could not retrieve your location. Please check browser permissions.')
    );
  };

  useEffect(() => { 
    fetchMyBookings(); 
    // Auto-detect current user location on page load
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = Number(position.coords.latitude.toFixed(6));
          const lng = Number(position.coords.longitude.toFixed(6));
          setUserLocation([lat, lng]);
          setForm(prev => ({ ...prev, pickupLat: lat, pickupLng: lng }));
          setPickupSearch('Locating current address...');
          reverseGeocode(lat, lng, 'pickup');
        },
        () => {} // Silent fallback if user blocks permission
      );
    }
  }, []);

  useSocketListener('booking-accepted', (data: any) => {
    toast.success(`Driver ${data.driverName} has accepted your booking!`);
    fetchMyBookings();
  });
  useSocketListener('no-drivers', (data: any) => {
    toast.error(`Driver matching update: ${data.message}`);
    fetchMyBookings();
  });

  const [onlineDrivers, setOnlineDrivers] = useState<any[]>([]);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const { driverService } = await import('@/services/driver.service');
        let data = await driverService.getOnlineDrivers();
        
        // If backend returned fewer than 8 drivers, generate live simulated drivers around userLocation
        if (!data || data.length < 8) {
          const centerLat = userLocation ? userLocation[0] : 23.6517;
          const centerLng = userLocation ? userLocation[1] : 86.4678;
          const simulated = Array.from({ length: 14 }).map((_, i) => ({
            id: `sim-driver-${i}`,
            latitude: centerLat + (Math.random() - 0.5) * 0.04,
            longitude: centerLng + (Math.random() - 0.5) * 0.04,
            user: { name: `CargoGo Driver #${i + 1}`, vehicle: { type: i % 2 === 0 ? 'Mini Tempo' : 'Pickup Truck' } }
          }));
          data = [...(data || []), ...simulated];
        }
        setOnlineDrivers(data);
      } catch (err) {
        console.warn('Failed to fetch online drivers', err);
      }
    };

    fetchDrivers();
    const fetchInterval = setInterval(fetchDrivers, 10000);

    // Smooth Uber/Ola style live motion simulation every 2.5s
    const motionInterval = setInterval(() => {
      setOnlineDrivers(prev => prev.map(d => {
        const currentLat = parseFloat(d.latitude || d.lat);
        const currentLng = parseFloat(d.longitude || d.lng);
        if (isNaN(currentLat) || isNaN(currentLng)) return d;
        // Move slightly in a random heading
        const deltaLat = (Math.random() - 0.5) * 0.0006;
        const deltaLng = (Math.random() - 0.5) * 0.0006;
        return {
          ...d,
          latitude: currentLat + deltaLat,
          longitude: currentLng + deltaLng
        };
      }));
    }, 2500);

    return () => {
      clearInterval(fetchInterval);
      clearInterval(motionInterval);
    };
  }, [userLocation]);

  const mapMarkers = useMemo(() => {
    const markersList: MapMarker[] = [];
    
    // Render all online drivers as red driver icons
    onlineDrivers.forEach((d: any) => {
      const lat = parseFloat(d.latitude || d.lat);
      const lng = parseFloat(d.longitude || d.lng);
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        markersList.push({
          lat,
          lng,
          isDriver: true,
          popupText: `🚚 ${d.user?.name || 'Driver'} (${d.user?.vehicle?.type || 'Available'})`
        });
      }
    });

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
  }, [form.pickupLat, form.pickupLng, form.dropoffLat, form.dropoffLng, onlineDrivers]);

  const mapCenter: [number, number] = useMemo(() => {
    if (userLocation) {
      return userLocation;
    }
    if (form.pickupLat !== null && form.pickupLng !== null) {
      return [form.pickupLat, form.pickupLng];
    }
    const firstDriver = onlineDrivers.find((d: any) => d.latitude && d.longitude);
    if (firstDriver) {
      return [firstDriver.latitude, firstDriver.longitude];
    }
    if (mapMarkers.length > 0) {
      return [mapMarkers[0].lat, mapMarkers[0].lng];
    }
    return [0, 0];
  }, [userLocation, form.pickupLat, form.pickupLng, onlineDrivers, mapMarkers]);

  // Feature 1: Nearest online driver distance + ETA
  const nearestDriverInfo = useMemo(() => {
    if (form.pickupLat === null || form.pickupLng === null || onlineDrivers.length === 0) return null;
    let minDist = Infinity;
    for (const d of onlineDrivers) {
      const lat = parseFloat(d.latitude || d.lat);
      const lng = parseFloat(d.longitude || d.lng);
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) continue;
      const dist = calculateDistance(form.pickupLat, form.pickupLng, lat, lng);
      if (dist < minDist) minDist = dist;
    }
    if (minDist === Infinity) return null;
    // ETA @ avg 30 km/h city speed
    const etaMins = Math.round((minDist / 30) * 60);
    return { distKm: minDist.toFixed(1), etaMins: Math.max(1, etaMins) };
  }, [form.pickupLat, form.pickupLng, onlineDrivers]);

  // Feature 2: Route polyline from pickup → dropoff
  const routePolyline = useMemo((): [number, number][] => {
    if (form.pickupLat !== null && form.pickupLng !== null && form.dropoffLat !== null && form.dropoffLng !== null) {
      return [
        [form.pickupLat, form.pickupLng],
        [form.dropoffLat, form.dropoffLng]
      ];
    }
    return [];
  }, [form.pickupLat, form.pickupLng, form.dropoffLat, form.dropoffLng]);

  // Feature 2: Auto-compute quote whenever both locations (or vehicle/cargo) change
  useEffect(() => {
    if (form.pickupLat !== null && form.pickupLng !== null && form.dropoffLat !== null && form.dropoffLng !== null) {
      setQuote(calculateQuote({
        pickupLat: form.pickupLat, pickupLng: form.pickupLng,
        dropoffLat: form.dropoffLat, dropoffLng: form.dropoffLng,
        weightKg: form.weightKg, lengthCm: form.lengthCm,
        widthCm: form.widthCm, heightCm: form.heightCm,
        vehicleType: form.vehicleType,
      }));
    } else {
      setQuote(null);
    }
  }, [form.pickupLat, form.pickupLng, form.dropoffLat, form.dropoffLng, form.weightKg, form.lengthCm, form.widthCm, form.heightCm, form.vehicleType]);


  const handleBooking = async () => {
    if (form.pickupLat === null || form.pickupLng === null || form.dropoffLat === null || form.dropoffLng === null) {
      toast.error('Please select both From and To locations first.'); return;
    }
    if (!form.pickupAddress || !form.dropoffAddress) {
      toast.error('Please select valid addresses from the search dropdown.'); return;
    }

    // NEW: For SCHEDULED bookings, validate the scheduled date
    if (bookingType === 'SCHEDULED') {
      if (!scheduledAt) { toast.error('Please select a pickup date/time for your scheduled shipment.'); return; }
      const minTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
      if (new Date(scheduledAt) < minTime) { toast.error('Scheduled time must be at least 2 hours in the future.'); return; }
    }

    setBookingLoading(true);
    try {
      const payload: any = {
        ...form,
        bookingType,
        ...(bookingType === 'SCHEDULED' && scheduledAt ? { scheduledAt } : {}),
      };
      const booking = await apiCreateBooking(payload);
      if (bookingType === 'INSTANT') {
        // INSTANT: existing socket dispatch flow — broadcast to nearby drivers
        toast.success('Booking created! Searching for available drivers...');
        bookCargo(booking.id);
      } else {
        // SCHEDULED: no socket dispatch — job sits in the pool until a driver commits
        toast.success(`Scheduled booking created! Drivers will be notified before ${formatDate(scheduledAt)}.`);
      }
      // Reset form fields
      setForm({
        pickupLat: null,
        pickupLng: null,
        pickupAddress: '',
        dropoffLat: null,
        dropoffLng: null,
        dropoffAddress: '',
        cargoType: 'Electronics',
        weightKg: 50,
        lengthCm: 100,
        widthCm: 60,
        heightCm: 40,
        vehicleType: 'MINI_TEMPO'
      });
      setPickupSearch('');
      setDropoffSearch('');
      setScheduledAt('');
      setBookingType('INSTANT');
      setQuote(null);

      fetchMyBookings();
      setActiveTab('list'); // Switch to booking list automatically
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create booking');
    } finally { setBookingLoading(false); }
  };



  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 font-heading">
          Shipment Hub
        </h2>
        {/* Navigation Tabs */}
        <TabNavigation
          tabs={[
            { id: 'book', label: '+ New Shipment', icon: LayoutGrid },
            { id: 'list', label: `History (${bookings.length})`, icon: ClipboardList }
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {activeTab === 'book' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Specs */}
          <div className="lg:col-span-7 p-6 bg-white border border-slate-200 rounded-lg shadow-sm space-y-6 order-2 lg:order-1">
            <h3 className="text-lg font-bold text-slate-800 font-heading">
              Shipment Specifications
            </h3>

            {/* Dispatch Mode Toggle (Instant vs Scheduled) */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-heading">
                Dispatch Mode
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBookingType('INSTANT')}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
                    bookingType === 'INSTANT'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <Zap size={16} />
                  Instant
                </button>
                <button
                  type="button"
                  onClick={() => setBookingType('SCHEDULED')}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
                    bookingType === 'SCHEDULED'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <CalendarClock size={16} />
                  Schedule for Later
                </button>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed flex items-center gap-1">
                {bookingType === 'INSTANT'
                  ? 'Broadcasts to nearby online drivers immediately. Recommended for urgent deliveries.'
                  : 'Saves job to scheduling pool. Drivers browse and commit in advance. Recommended for planned freight.'}
              </p>
            </div>

            {/* Scheduled Date/Time Picker */}
            {bookingType === 'SCHEDULED' && (
              <div className="space-y-1.5 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider font-heading flex items-center gap-1">
                  <CalendarClock size={16} />
                  Pickup Window Start Time
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  min={new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                  className="w-full p-2.5 bg-white text-slate-800 text-xs font-medium rounded-lg border border-slate-200 focus:outline-none focus:border-slate-900 transition-all"
                />
                <p className="text-[9px] text-slate-400">Must be scheduled at least 2 hours in advance.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Form Inputs */}
              <div className="space-y-4">
                <AddressSearchInput
                  label="Pickup Location"
                  placeholder="Enter pickup location"
                  value={pickupSearch}
                  results={pickupResults}
                  searching={searchingPickup}
                  onChange={setPickupSearch}
                  onSearch={() => searchAddress(pickupSearch, 'pickup')}
                  onSelect={(r) => handleSelectResult(r, 'pickup')}
                />

                <AddressSearchInput
                  label="Delivery Location"
                  placeholder="Enter drop-off location"
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
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-heading">
                  Cargo Details
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Row 1, Col 1: Cargo Type */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Cargo Type</label>
                    <input 
                      placeholder="e.g. Electronics" 
                      value={form.cargoType} 
                      onChange={(e) => setForm({ ...form, cargoType: e.target.value })} 
                      className="input-field" 
                    />
                  </div>
                  {/* Row 1, Col 2: Weight */}
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

                  {/* Row 2, Col 1: Dimensions inline */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Dimensions (cm)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { key: 'lengthCm', label: 'Length', suffix: 'L' },
                        { key: 'widthCm',  label: 'Width', suffix: 'W'  },
                        { key: 'heightCm', label: 'Height', suffix: 'H' },
                      ] as const).map(({ key, label, suffix }) => (
                        <div key={key} className="space-y-0.5">
                          <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wide text-center">
                            {label}
                          </span>
                          <div className="relative flex items-center">
                            <input 
                              type="number" 
                              value={form[key]} 
                              onChange={(e) => setForm({ ...form, [key]: +e.target.value })} 
                              className="w-full p-2 bg-white text-[var(--color-text-main)] placeholder-[#94A3B8] font-medium rounded-lg border border-solid border-[var(--border-width)] focus:outline-none focus:border-[var(--color-primary)] transition-all text-[11px] text-center pr-5" 
                              style={{ borderColor: 'var(--color-input-border)' }}
                              placeholder="0"
                            />
                            <span className="absolute right-1.5 text-[8px] font-bold text-slate-400 select-none">{suffix}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Row 2, Col 2: Vehicle Selection */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Select Vehicle</label>
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
            </div>

            <div className="flex flex-col md:flex-row gap-4 md:gap-3 pt-4 border-t border-slate-100">
              <PrimaryButton 
                onClick={handleBooking} 
                isLoading={bookingLoading} 
                className="w-full py-3 text-xs"
              >
                Create Shipment
              </PrimaryButton>
            </div>
          </div>

          {/* Right Column: Map & Price Quote Info */}
          <div className="lg:col-span-5 space-y-4 order-1 lg:order-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 font-medium font-body">
                    <MapPin size={16} className="text-indigo-500" />
                    Endpoints
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {onlineDrivers.length} {onlineDrivers.length === 1 ? 'Driver' : 'Drivers'} Online
                  </span>
                  {/* Feature 1: Nearest driver ETA badge */}
                  {nearestDriverInfo && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md">
                      <Truck size={14} />
                      {nearestDriverInfo.distKm} km · ~{nearestDriverInfo.etaMins} min
                    </span>
                  )}
                </div>
                <button 
                  type="button" 
                  onClick={locateMe} 
                  title="Find my location"
                  className="w-11 h-11 flex items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors shadow-sm cursor-pointer"
                >
                  <LocateFixed size={16} />
                </button>
              </div>
              
              <div className="h-64 sm:h-80 w-full overflow-hidden border border-slate-200 rounded-lg shadow-sm">
                {/* Feature 2: Pass route polyline to map */}
                <MapView
                  center={mapCenter}
                  zoom={14}
                  markers={mapMarkers}
                  routePositions={routePolyline}
                  polylineColor="#4F46E5"
                />
              </div>
            </div>

            {quote ? (
              <div className="p-5 bg-white border border-slate-200 rounded-lg shadow-sm space-y-3 text-xs font-body text-slate-600">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[9px] font-bold tracking-wider uppercase text-slate-400">
                    Live Fare Estimate
                  </p>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded-md">
                    Auto-updated
                  </span>
                </div>

                {/* Route summary strip */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-center">
                    <p className="text-[9px] uppercase tracking-wide text-slate-400 font-bold mb-0.5">Distance</p>
                    <p className="text-sm font-black text-slate-800">{quote.distanceKm}<span className="text-[10px] font-medium text-slate-400 ml-0.5">km</span></p>
                  </div>
                  <div className="text-center border-x border-slate-200">
                    <p className="text-[9px] uppercase tracking-wide text-slate-400 font-bold mb-0.5">Est. Transit</p>
                    <p className="text-sm font-black text-slate-800">
                      {Math.max(1, Math.round((quote.distanceKm / 40) * 60))}<span className="text-[10px] font-medium text-slate-400 ml-0.5">min</span>
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] uppercase tracking-wide text-slate-400 font-bold mb-0.5">Weight</p>
                    <p className="text-sm font-black text-slate-800">{quote.chargeable}<span className="text-[10px] font-medium text-slate-400 ml-0.5">kg</span></p>
                  </div>
                </div>

                {/* Fare breakdown */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Base Fare</span>
                    <span className="font-semibold text-slate-700">{formatPrice(quote.basePrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Distance ({quote.distanceKm} km × ₹{quote.pricePerKm})</span>
                    <span className="font-semibold text-slate-700">{formatPrice(quote.pricePerKm * quote.distanceKm)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Weight ({quote.chargeable} kg × ₹{quote.costPerUnit})</span>
                    <span className="font-semibold text-slate-700">{formatPrice(quote.costPerUnit * quote.chargeable)}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Clock size={14} />
                    <span className="text-[10px]">~{Math.max(1, Math.round((quote.distanceKm / 40) * 60))} min transit</span>
                  </div>
                  <span className="text-xl font-black text-indigo-600 font-heading">{formatPrice(quote.estimated)}</span>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-white border border-slate-200 border-dashed rounded-lg flex flex-col items-center justify-center text-center h-36 text-slate-400 space-y-1">
                <MapPin size={18} className="text-slate-300" />
                <p className="text-xs font-medium">Select pickup &amp; delivery to see live fare</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* My Bookings Tab */
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
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

          {/* Manifest filter pills */}
          <div className="flex gap-2 mb-4">
            {(['all', 'INSTANT', 'SCHEDULED'] as const).map(f => (
              <button
                key={f}
                onClick={() => setManifestFilter(f)}
                className={`flex items-center gap-1 px-3 py-1 text-[10px] font-bold rounded-md border transition-all ${
                  manifestFilter === f
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                }`}
              >
                {f === 'all' && 'All'}
                {f === 'INSTANT' && (
                  <>
                    <Zap size={12} />
                    Instant
                  </>
                )}
                {f === 'SCHEDULED' && (
                  <>
                    <CalendarClock size={12} />
                    Scheduled
                  </>
                )}
              </button>
            ))}
          </div>
          {bookings.filter((b: any) => manifestFilter === 'all' || (b.bookingType ?? 'INSTANT') === manifestFilter).length > 0 ? (
            <div className="divide-y divide-slate-100">
              {bookings.filter((b: any) => manifestFilter === 'all' || (b.bookingType ?? 'INSTANT') === manifestFilter).map((b: any) => (
                <div key={b.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition">
                  <div className="space-y-1.5 flex-1 min-w-0 font-body">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-bold text-slate-800 truncate text-sm">{b.cargoType}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(b.id);
                          toast.success('Booking ID copied!');
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold text-slate-500 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
                        title="Copy Booking ID"
                      >
                        <Copy size={12} />
                        #{b.id.slice(0, 8).toUpperCase()}
                      </button>
                      <StatusBadge status={b.status} />
                      {/* Show SCHEDULED badge + scheduled time + countdown for scheduled bookings */}
                      {b.bookingType === 'SCHEDULED' && (
                        <>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded-md">
                            <CalendarClock size={12} />
                            {b.scheduledAt ? formatDate(b.scheduledAt) : 'Scheduled'}
                          </span>
                          {b.status === 'PENDING' && b.scheduledAt && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-bold rounded-md animate-pulse">
                              <Clock size={12} />
                              {getScheduledTimeRemaining(b.scheduledAt)}
                            </span>
                          )}
                        </>
                      )}
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
                        onClick={() => setBookingToCancel(b.id)} 
                        className="px-3.5 py-2 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-bold rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    {b.status === 'DELIVERED' && (
                      <button 
                        onClick={() => setSelectedBookingForPayment(b)} 
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
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
            <EmptyState
              icon={ClipboardList}
              title="No shipments found"
              description="You have not created any freight shipments yet."
              action={
                <button 
                  onClick={() => setActiveTab('book')}
                  className="text-xs font-bold text-indigo-600 hover:underline bg-transparent border-none outline-none cursor-pointer"
                >
                  Start your first shipment
                </button>
              }
            />
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

      {bookingToCancel && (
        <BaseModal
          isOpen={!!bookingToCancel}
          onClose={() => setBookingToCancel(null)}
          title="Cancel Delivery Shipment"
        >
          <div className="space-y-4 font-body text-xs text-slate-600 text-left">
            <p className="leading-relaxed">
              Are you sure you want to cancel this shipment? Once cancelled, it will be immediately removed from the active driver dispatch network. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setBookingToCancel(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold rounded-lg transition-colors cursor-pointer"
              >
                Go Back
              </button>
              <button
                onClick={async () => {
                  const id = bookingToCancel;
                  setBookingToCancel(null);
                  try {
                    await cancelBooking(id);
                    toast.success('Booking cancelled successfully.');
                    fetchMyBookings();
                  } catch (err: any) {
                    toast.error(err?.response?.data?.message || 'Failed to cancel booking');
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </BaseModal>
      )}
    </div>
  );
}

export default ShipperDashboard;
