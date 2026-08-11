import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBooking } from '@/hooks/useBooking';
import { useSocket, useSocketListener } from '@/hooks/useSocket';
import PaymentModal from '@/components/dashboard/PaymentModal';
import BaseModal from '@/components/ui/BaseModal';
import StatusBadge from '@/components/ui/StatusBadge';
import MapView, { MapMarker } from '@/components/map/MapView';
import DashboardHeader from '@/components/ui/DashboardHeader';
import MapOverlayCard from '@/components/ui/MapOverlayCard';
import LocateButton from '@/components/ui/LocateButton';
import { calculateQuote } from '@/utils/pricing';
import { toast } from 'react-hot-toast';
import { geocodingService } from '@/services/geocoding.service';
import { BookingType } from '@/types/booking.types';
import TabNavigation from '@/components/ui/TabNavigation';
import IconButton from '@/components/ui/IconButton';
import { formatDate } from '@/utils/formatters';
import {
  ChevronRight,
  ArrowLeft,
  Scale,
  Truck,
  RefreshCw,
  ChevronDown,
  MapPin
} from 'lucide-react';

function ShipperDashboard() {
  const { token } = useAuth();
  const { bookings, fetchMyBookings, createBooking: apiCreateBooking, cancelBooking } = useBooking();
  const { bookCargo } = useSocket(token);
  const navigate = useNavigate();

  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<any | null>(null);
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [activeView, setActiveView] = useState<'book' | 'bookings'>('book');
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'INSTANT' | 'SCHEDULED'>('ALL');

  
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  
  const bookingType: BookingType = 'INSTANT';

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
        setPickupResults([]);
        setForm(prev => ({ ...prev, pickupLat: lat, pickupLng: lng, pickupAddress: displayName }));
      } else {
        setDropoffSearch(displayName);
        setDropoffResults([]);
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
      throw new Error('No results');
    } catch (e) {
      console.warn(e);
      if (type === 'pickup') setPickupResults([]); else setDropoffResults([]);
    } finally {
      if (type === 'pickup') setSearchingPickup(false); else setSearchingDropoff(false);
    }
  };

  
  useEffect(() => {
    if (!pickupSearch || pickupSearch.length < 3 || pickupSearch.startsWith('Locating') || pickupSearch === form.pickupAddress) {
      setPickupResults([]);
      return;
    }
    const timer = setTimeout(() => {
      searchAddress(pickupSearch, 'pickup');
    }, 450);
    return () => clearTimeout(timer);
  }, [pickupSearch, form.pickupAddress]);

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
    if (!navigator.geolocation) {
      toast.error('Location services are not supported by your browser.');
      return;
    }
    setPickupSearch('Locating current address...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        setUserLocation([lat, lng]);
        setForm(prev => ({ ...prev, pickupLat: lat, pickupLng: lng }));
        reverseGeocode(lat, lng, 'pickup');
      },
      (error) => {
        toast.error(`Location Error: ${error.message}`);
        setPickupSearch('');
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

  const [onlineDrivers, setOnlineDrivers] = useState<any[]>([]);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const { driverService } = await import('@/services/driver.service');
        let data = await driverService.getOnlineDrivers();
        if (!data || data.length < 8) {
          const centerLat = userLocation ? userLocation[0] : 23.6517;
          const centerLng = userLocation ? userLocation[1] : 86.4678;
          const simulated = Array.from({ length: 14 }).map((_, i) => ({
            id: `sim-driver-${i}`,
            latitude: centerLat + (Math.random() - 0.5) * 0.04,
            longitude: centerLng + (Math.random() - 0.5) * 0.04,
            user: { name: `Driver #${i + 1}`, vehicle: { type: i % 2 === 0 ? 'Mini Tempo' : 'Pickup Truck' } }
          }));
          data = [...(data || []), ...simulated];
        }
        setOnlineDrivers(data);
      } catch (err) {
        console.warn(err);
      }
    };
    fetchDrivers();
    const interval = setInterval(fetchDrivers, 10000);
    return () => clearInterval(interval);
  }, [userLocation]);

  const mapMarkers = useMemo(() => {
    const list: MapMarker[] = [];
    onlineDrivers.forEach((d) => {
      const lat = parseFloat(d.latitude || d.lat);
      const lng = parseFloat(d.longitude || d.lng);
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        list.push({
          lat,
          lng,
          isDriver: true,
          popupText: `🚚 ${d.user?.name || 'Driver'} (${d.user?.vehicle?.type || 'Available'})`
        });
      }
    });
    if (form.pickupLat !== null && form.pickupLng !== null) {
      list.push({
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
      list.push({
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
    return list;
  }, [form.pickupLat, form.pickupLng, form.dropoffLat, form.dropoffLng, onlineDrivers]);

  const mapCenter: [number, number] = useMemo(() => {
    if (userLocation) return userLocation;
    if (form.pickupLat !== null && form.pickupLng !== null) return [form.pickupLat, form.pickupLng];
    return [20.5937, 78.9629];
  }, [userLocation, form.pickupLat, form.pickupLng]);

  const routePolyline = useMemo((): [number, number][] => {
    if (form.pickupLat !== null && form.pickupLng !== null && form.dropoffLat !== null && form.dropoffLng !== null) {
      return [
        [form.pickupLat, form.pickupLng],
        [form.dropoffLat, form.dropoffLng]
      ];
    }
    return [];
  }, [form.pickupLat, form.pickupLng, form.dropoffLat, form.dropoffLng]);

  const rates: Record<string, { title: string; basePrice: number; pricePerKm: number; costPerUnit: number; capacity: string }> = {
    MINI_TEMPO: { title: 'Mini Tempo', basePrice: 50, pricePerKm: 12, costPerUnit: 4, capacity: 'Up to 500 kg' },
    PICKUP_TRUCK: { title: 'Pickup Truck', basePrice: 80, pricePerKm: 15, costPerUnit: 5, capacity: 'Up to 1.5 Tons' },
    CONTAINER_3TON: { title: '3-Ton Container', basePrice: 150, pricePerKm: 20, costPerUnit: 7, capacity: 'Up to 3.0 Tons' },
  };

  const getEstimatedPrice = (key: string) => {
    const q = calculateQuote({
      pickupLat: form.pickupLat || 0,
      pickupLng: form.pickupLng || 0,
      dropoffLat: form.dropoffLat || 0,
      dropoffLng: form.dropoffLng || 0,
      weightKg: form.weightKg,
      lengthCm: form.lengthCm,
      widthCm: form.widthCm,
      heightCm: form.heightCm,
      vehicleType: key as any
    });
    return Math.round(q.estimated);
  };

  const handleBooking = async () => {
    if (form.pickupLat === null || form.pickupLng === null || form.dropoffLat === null || form.dropoffLng === null) {
      toast.error('Please select locations first.'); return;
    }

    setBookingLoading(true);
    try {
      const payload = {
        ...form,
        bookingType
      };
      const booking = await apiCreateBooking(payload as any);
      toast.success('Shipment booked! Dispatching nearby drivers...');
      bookCargo(booking.id);
      setForm(prev => ({
        ...prev,
        pickupLat: null,
        pickupLng: null,
        pickupAddress: '',
        dropoffLat: null,
        dropoffLng: null,
        dropoffAddress: ''
      }));
      setPickupSearch('');
      setDropoffSearch('');
      setStep(1);
      fetchMyBookings();
      setActiveView('bookings');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create booking');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelBooking = async (id: string) => {
    try {
      await cancelBooking(id);
      toast.success('Booking cancelled.');
      fetchMyBookings();
      setBookingToCancel(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to cancel');
    }
  };

  
  const filteredBookings = useMemo(() => {
    if (historyFilter === 'ALL') return bookings;
    return bookings.filter((b: any) => b.bookingType === historyFilter);
  }, [bookings, historyFilter]);



  return (
    <div className="relative h-[calc(100vh-64px)] w-full overflow-hidden bg-white flex flex-col">
      <style>{`
        .leaflet-control-attribution {
          display: none !important;
        }
        ::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        * {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>

      {}
      <DashboardHeader
        title="Dashboard"
        tabs={[
          { id: 'book', label: '+ New' },
          { id: 'bookings', label: `History (${bookings.length})` }
        ]}
        activeTab={activeView}
        onChange={(id) => {
          if (id === 'bookings') {
            fetchMyBookings();
          }
          setActiveView(id as any);
        }}
      />

      {activeView === 'book' ? (
        
        <div className="flex-1 w-full p-2 sm:p-4 relative flex flex-col min-h-0 overflow-hidden bg-white">
          <div className="relative w-full h-full flex-1 rounded-xl border border-slate-200 shadow-xs overflow-hidden bg-white">
            
            {}
            <div className="absolute inset-0 z-0 h-full w-full">
              <MapView
                center={mapCenter}
                zoom={userLocation || form.pickupLat !== null ? 14 : 5}
                markers={mapMarkers}
                routePositions={routePolyline}
                polylineColor="#0F172A"
              />
            </div>

            {}
            
            {}
            <div className="absolute top-3 right-3 md:top-4 md:right-4 z-20">
              <LocateButton onClick={locateMe} />
            </div>

            {}
            <MapOverlayCard>
              {step === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold font-heading text-slate-900 tracking-tight">New Booking</h3>
                    {}
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => { if (s < step) setStep(s as any); }}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            s === step ? 'w-5 bg-slate-950' : 'w-1.5 bg-slate-200 hover:bg-slate-300'
                          }`}
                          aria-label={`Go to slide ${s}`}
                        />
                      ))}
                    </div>
                  </div>

                  {}
                  <div className="relative space-y-1.5 text-left">
                    <label className="block text-xs font-bold text-slate-700">Pickup</label>
                    <input
                      placeholder="Enter pickup address"
                      value={pickupSearch}
                      onChange={(e) => setPickupSearch(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs font-medium focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400"
                    />
                    {searchingPickup && <p className="text-[10px] text-slate-400 mt-1">Searching...</p>}
                    {pickupResults.length > 0 && (
                      <div className="absolute z-[2000] w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {pickupResults.map((r, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSelectResult(r, 'pickup')}
                            className="w-full text-left p-2.5 hover:bg-slate-50 text-xs border-b last:border-b-0 block truncate text-slate-700"
                          >
                            {r.display_name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {}
                  <div className="relative space-y-1.5 text-left pt-0.5">
                    <label className="block text-xs font-bold text-slate-700">Dropoff</label>
                    <input
                      placeholder="Enter dropoff address"
                      value={dropoffSearch}
                      onChange={(e) => setDropoffSearch(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs font-medium focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400"
                    />
                    {searchingDropoff && <p className="text-[10px] text-slate-400 mt-1">Searching...</p>}
                    {dropoffResults.length > 0 && (
                      <div className="absolute z-[2000] w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {dropoffResults.map((r, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSelectResult(r, 'dropoff')}
                            className="w-full text-left p-2.5 hover:bg-slate-50 text-xs border-b last:border-b-0 block truncate text-slate-700"
                          >
                            {r.display_name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={!form.pickupLat || !form.dropoffLat}
                    onClick={() => setStep(2)}
                    className="w-full h-10 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-lg transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:border disabled:border-slate-200/80 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-1.5 mt-3 text-xs font-heading shadow-xs cursor-pointer"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="p-1 -ml-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Back"
                      >
                        <ArrowLeft size={16} />
                      </button>
                      <h3 className="text-lg font-bold font-heading text-slate-900 tracking-tight">Cargo</h3>
                    </div>
                    {}
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => { if (s < step) setStep(s as any); }}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            s === step ? 'w-5 bg-slate-950' : 'w-1.5 bg-slate-200 hover:bg-slate-300'
                          }`}
                          aria-label={`Go to slide ${s}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5 text-left">
                      <label className="block text-xs font-bold text-slate-700">Weight</label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          value={form.weightKg}
                          onChange={(e) => setForm({...form, weightKg: Math.max(1, +e.target.value)})}
                          className="w-full h-10 pl-9 pr-8 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs font-bold focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-body"
                          min={1}
                        />
                        <span className="absolute left-3 text-slate-400"><Scale size={14} /></span>
                        <span className="absolute right-3 text-xs font-bold text-slate-400 font-heading">kg</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="block text-xs font-bold text-slate-700">Cargo Type</label>
                      <input
                        placeholder="Electronics, Furniture, etc."
                        value={form.cargoType}
                        onChange={(e) => setForm({...form, cargoType: e.target.value})}
                        className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs font-medium focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-body placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="w-full h-10 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs font-heading shadow-xs cursor-pointer"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="p-1 -ml-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Back"
                      >
                        <ArrowLeft size={16} />
                      </button>
                      <h3 className="text-lg font-bold font-heading text-slate-900 tracking-tight">Vehicle</h3>
                    </div>
                    {}
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => { if (s < step) setStep(s as any); }}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            s === step ? 'w-5 bg-slate-950' : 'w-1.5 bg-slate-200 hover:bg-slate-300'
                          }`}
                          aria-label={`Go to slide ${s}`}
                        />
                      ))}
                    </div>
                  </div>

                  {}
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 my-2">
                    {Object.keys(rates).map((key) => {
                      const isSelected = form.vehicleType === key;
                      const opt = rates[key];
                      const estPrice = getEstimatedPrice(key);

                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setForm({ ...form, vehicleType: key as any })}
                          className={`w-full p-3.5 flex items-center justify-between transition-colors cursor-pointer text-left ${
                            isSelected
                              ? 'bg-slate-950 text-white font-bold'
                              : 'bg-white hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'}`}>
                              <Truck size={18} />
                            </div>
                            <div>
                              <span className={`block text-xs font-extrabold leading-tight font-heading ${isSelected ? 'text-white' : 'text-slate-900'}`}>{opt.title}</span>
                              <span className={`block text-[10px] font-medium mt-0.5 font-body ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>{opt.capacity}</span>
                            </div>
                          </div>
                          <span className={`text-sm font-black font-heading ${isSelected ? 'text-white' : 'text-slate-900'}`}>₹{estPrice}</span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={handleBooking}
                    disabled={bookingLoading}
                    className="w-full h-10 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-xs mt-2 disabled:opacity-50 text-xs font-heading cursor-pointer"
                  >
                    {bookingLoading ? 'Booking...' : 'Book'}
                  </button>
                </div>
              )}
            </MapOverlayCard>

          </div>
        </div>
      ) : (
        
        <div className="flex-1 w-full bg-white flex flex-col overflow-y-auto px-8 py-6 space-y-4">

            {}
            <div className="flex items-center justify-between pb-3 border-b border-slate-150">
              <TabNavigation
                tabs={[
                  { id: 'ALL', label: 'All' },
                  { id: 'INSTANT', label: 'Instant' },
                  { id: 'SCHEDULED', label: 'Scheduled' }
                ]}
                activeTab={historyFilter}
                onChange={setHistoryFilter}
              />

              <IconButton
                icon={RefreshCw}
                onClick={fetchMyBookings}
                title="Refresh"
              />
            </div>

            {}
            <div className="divide-y divide-slate-100 border-t border-b border-slate-100">
              {filteredBookings.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-sm font-medium">
                  No shipments.
                </div>
              ) : (
                filteredBookings.map((b: any) => {
                  const isExpanded = expandedBookingId === b.id;
                  return (
                    <div
                      key={b.id}
                      className="py-4 px-2 flex flex-col cursor-pointer hover:bg-slate-50/70 transition-colors"
                      onClick={() => setExpandedBookingId(isExpanded ? null : b.id)}
                    >
                      {}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-sm text-slate-900 font-heading">
                            {b.cargoType}
                          </span>
                          <StatusBadge status={b.status} />
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-sm font-black text-slate-900 font-heading">
                            ₹{Math.round(b.price)}
                          </span>
                          <ChevronDown
                            size={16}
                            className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </div>
                      </div>

                      {}
                      {isExpanded && (
                        <div
                          className="mt-3 pt-3 border-t border-slate-150 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-700 text-left animate-fadeIn"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="space-y-3">
                            <div>
                              <span className="text-xs font-bold text-slate-700 block">Booking ID</span>
                              <span className="font-mono font-bold text-slate-900 text-xs">#{b.id.substring(0, 8).toUpperCase()}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <MapPin size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="text-xs font-bold text-slate-700 block">Pickup</span>
                                <span className="font-medium text-slate-800 leading-snug block mt-0.5">{b.pickupAddress}</span>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <MapPin size={14} className="text-rose-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="text-xs font-bold text-slate-700 block">Dropoff</span>
                                <span className="font-medium text-slate-800 leading-snug block mt-0.5">{b.dropoffAddress}</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3 md:border-l md:border-slate-150 md:pl-5 flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-700">Date</span>
                                <span className="font-mono font-medium text-slate-800 text-xs">{formatDate(b.createdAt)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-700">Vehicle</span>
                                <span className="font-bold text-slate-900 text-xs">
                                  {b.vehicleType === 'MINI_TEMPO' ? 'Mini Tempo' : b.vehicleType === 'PICKUP_TRUCK' ? 'Pickup Truck' : b.vehicleType === 'CONTAINER_3TON' ? '3-Ton Container' : b.vehicleType}
                                </span>
                              </div>
                              {b.status === 'ACCEPTED' && (
                                <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200 mt-1">
                                  <span className="text-slate-700 font-bold text-xs">Pickup OTP</span>
                                  <strong className="font-mono text-slate-900 text-xs tracking-wider font-extrabold">{b.pickupOTP}</strong>
                                </div>
                              )}
                              {b.status === 'IN_TRANSIT' && (
                                <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200 mt-1">
                                  <span className="text-slate-700 font-bold text-xs">Dropoff OTP</span>
                                  <strong className="font-mono text-slate-900 text-xs tracking-wider font-extrabold">{b.dropoffOTP}</strong>
                                </div>
                              )}
                            </div>

                            {}
                            <div className="flex items-center gap-2 pt-3 justify-end">
                              {['PENDING', 'ACCEPTED'].includes(b.status) && (
                                <button
                                  type="button"
                                  onClick={() => setBookingToCancel(b.id)}
                                  className="px-3.5 py-1.5 border border-rose-200 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer font-heading"
                                >
                                  Cancel
                                </button>
                              )}
                              {b.status === 'DELIVERED' && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedBookingForPayment(b)}
                                  className="px-3.5 py-1.5 bg-slate-950 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition font-heading shadow-xs cursor-pointer"
                                >
                                  Pay Fare
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => navigate(`/track/${b.id}`)}
                                className="px-3.5 py-1.5 bg-slate-950 text-white font-bold rounded-lg text-xs hover:bg-slate-800 transition font-heading shadow-xs cursor-pointer"
                              >
                                Track
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
        </div>
      )}

      {}
      {bookingToCancel && (
        <BaseModal
          isOpen={true}
          onClose={() => setBookingToCancel(null)}
          title="Cancel Booking"
        >
          <div className="space-y-4 text-left">
            <p className="text-sm text-slate-600 font-body">Cancel booking?</p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setBookingToCancel(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-655 text-xs font-bold rounded-lg transition font-heading"
              >
                No
              </button>
              <button
                onClick={() => handleCancelBooking(bookingToCancel)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition font-heading"
              >
                Yes
              </button>
            </div>
          </div>
        </BaseModal>
      )}

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
