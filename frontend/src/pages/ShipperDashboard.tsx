import { useState, useEffect } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { io } from 'socket.io-client';

const VEHICLE_RATES: Record<string, { basePrice: number; pricePerKm: number; costPerUnit: number }> = {
  TWO_WHEELER: { basePrice: 20, pricePerKm: 5, costPerUnit: 1 },
  THREE_WHEELER: { basePrice: 30, pricePerKm: 8, costPerUnit: 2 },
  MINI_TEMPO: { basePrice: 50, pricePerKm: 12, costPerUnit: 4 },
  PICKUP_TRUCK: { basePrice: 80, pricePerKm: 15, costPerUnit: 5 },
  CONTAINER_3TON: { basePrice: 150, pricePerKm: 20, costPerUnit: 7 },
  HEAVY_DUTY_TRUCK: { basePrice: 300, pricePerKm: 45, costPerUnit: 12 },
};

function ShipperDashboard() {
  const [pickupInput, setPickupInput] = useState('19.0760, 72.8777');
  const [dropoffInput, setDropoffInput] = useState('19.2183, 72.9781');
  const [cargoType, setCargoType] = useState('Electronics');
  const [weightKg, setWeightKg] = useState(500);
  const [volumeInput, setVolumeInput] = useState('120 x 80 x 90');

  const [form, setForm] = useState({
    pickupLat: 19.0760,
    pickupLng: 72.8777,
    dropoffLat: 19.2183,
    dropoffLng: 72.9781,
    cargoType: 'Electronics',
    weightKg: 500,
    lengthCm: 120,
    widthCm: 80,
    heightCm: 90,
    vehicleType: 'MINI_TEMPO' as 'TWO_WHEELER' | 'THREE_WHEELER' | 'MINI_TEMPO' | 'PICKUP_TRUCK' | 'CONTAINER_3TON' | 'HEAVY_DUTY_TRUCK'
  });

  const [liveQuote, setLiveQuote] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [socket, setSocket] = useState<any>(null);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  // Socket communication
  useEffect(() => {
    const s = io(`http://${window.location.hostname}:5000`, { auth: { token } });
    s.on('connect', () => console.log('Shipper Socket connected'));
    s.on('booking-accepted', () => {
      fetchBookings();
    });
    s.on('no-drivers', (data: any) => {
      alert('No drivers found nearby: ' + data.message);
      fetchBookings();
    });
    setSocket(s);
    return () => { s.disconnect(); };
  }, [token]);

  // Load bookings initially
  useEffect(() => {
    fetchBookings();
  }, []);

  // Update form inputs reactively
  useEffect(() => {
    setForm(f => ({ ...f, cargoType, weightKg }));
  }, [cargoType, weightKg]);

  // Coordinate parsers
  const handlePickupChange = (val: string) => {
    setPickupInput(val);
    const parts = val.split(',').map(s => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      setForm(f => ({ ...f, pickupLat: parts[0], pickupLng: parts[1] }));
    }
  };

  const handleDropoffChange = (val: string) => {
    setDropoffInput(val);
    const parts = val.split(',').map(s => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      setForm(f => ({ ...f, dropoffLat: parts[0], dropoffLng: parts[1] }));
    }
  };

  // Dimensions parser (L x W x H)
  const handleVolumeChange = (val: string) => {
    setVolumeInput(val);
    const parts = val.toLowerCase().split('x').map(s => parseFloat(s.trim()));
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      setForm(f => ({ ...f, lengthCm: parts[0], widthCm: parts[1], heightCm: parts[2] }));
    }
  };

  // Live real-time pricing calculation
  useEffect(() => {
    const distance = calcHaversine(form.pickupLat, form.pickupLng, form.dropoffLat, form.dropoffLng);
    const volumetric = (form.lengthCm * form.widthCm * form.heightCm) / 5000;
    const chargeable = Math.max(form.weightKg, volumetric);
    const rate = VEHICLE_RATES[form.vehicleType];

    const distancePrice = Math.round(rate.pricePerKm * distance);
    const cargoPrice = Math.round(rate.costPerUnit * chargeable);
    const totalPrice = Math.round((rate.basePrice + distancePrice + cargoPrice) * 100) / 100;

    setLiveQuote({
      distanceKm: distance.toFixed(1),
      volumetricWeight: volumetric.toFixed(0),
      chargeableWeight: chargeable.toFixed(0),
      basePrice: rate.basePrice,
      distancePrice,
      cargoPrice,
      totalPrice
    });
  }, [form]);

  // Haversine formula implementation
  const toRad = (value: number) => (value * Math.PI) / 180;
  const calcHaversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
  };

  const createBooking = async () => {
    try {
      const res = await axios.post(`http://${window.location.hostname}:5000/api/bookings/createBooking`,
        form, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (socket) {
        socket.emit('book-cargo', { bookingId: res.data.data.booking.id });
      }

      fetchBookings();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to create booking');
    }
  };

  const fetchBookings = async () => {
    const res = await axios.get(`http://${window.location.hostname}:5000/api/bookings/my`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    setBookings(res.data.data);
  };

  // Helper: Friendly Proximity-Based Location Formatter
  const getFriendlyLocationName = (lat: number, lng: number) => {
    if (Math.abs(lat - 19.0760) < 0.02 && Math.abs(lng - 72.8777) < 0.02) return 'Kurla Market';
    if (Math.abs(lat - 19.2183) < 0.02 && Math.abs(lng - 72.9781) < 0.02) return 'Navi Mumbai';
    if (Math.abs(lat - 19.01) < 0.05 && Math.abs(lng - 72.85) < 0.05) return 'Dadar';
    if (Math.abs(lat - 19.23) < 0.05 && Math.abs(lng - 72.85) < 0.05) return 'Borivali East';
    return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
  };

  // Helper: Format vehicle name beautifully
  const formatVehicleName = (type: string) => {
    switch (type) {
      case 'TWO_WHEELER': return 'Two Wheeler';
      case 'THREE_WHEELER': return 'Three Wheeler';
      case 'MINI_TEMPO': return 'Mini Tempo';
      case 'PICKUP_TRUCK': return 'Pickup Truck';
      case 'CONTAINER_3TON': return '3-Ton Container';
      case 'HEAVY_DUTY_TRUCK': return 'Heavy Duty Truck';
      default: return type;
    }
  };

  // Rebooking Helper
  const handleRebook = (b: any) => {
    setPickupInput(`${b.pickupLat}, ${b.pickupLng}`);
    setDropoffInput(`${b.dropoffLat}, ${b.dropoffLng}`);
    setCargoType(b.cargoType);
    setWeightKg(b.weightKg);
    setVolumeInput(`${b.lengthCm} x ${b.widthCm} x ${b.heightCm}`);
    setForm({
      pickupLat: b.pickupLat,
      pickupLng: b.pickupLng,
      dropoffLat: b.dropoffLat,
      dropoffLng: b.dropoffLng,
      cargoType: b.cargoType,
      weightKg: b.weightKg,
      lengthCm: b.lengthCm,
      widthCm: b.widthCm,
      heightCm: b.heightCm,
      vehicleType: b.vehicleType
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Stats Calculations
  const inProgress = bookings.filter(b => !['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(b.status));
  const completed = bookings.filter(b => ['DELIVERED', 'COMPLETED'].includes(b.status));

  const activeDispatches = inProgress.length;
  const totalShipments = bookings.length;
  const totalSpent = bookings.reduce((sum, b) => sum + b.price, 0);

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('en-IN').format(val);
  };


  return (
    <div className="space-y-6">

      {/* 2-Column Responsive Dashboard Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start select-none">

        {/* LEFT COLUMN: BOOK A SHIPMENT FORM */}
        <div className="md:col-span-5 bg-white border border-[#E8E6E0] p-6 rounded-2xl shadow-sm">
          {/* Form Header */}
          <div className="flex items-center gap-2 mb-6">
            <svg className="h-4 w-4 text-[#1A1A1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h2 className="text-xs font-black text-[#1A1A1A] uppercase tracking-widest">
              Book a Shipment
            </h2>
          </div>

          <div className="space-y-4">
            {/* Pickup & Dropoff Coordinate inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Pickup Location
                </label>
                <input
                  type="text"
                  placeholder="Enter coordinates"
                  value={pickupInput}
                  onChange={(e) => handlePickupChange(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Dropoff Location
                </label>
                <input
                  type="text"
                  placeholder="Enter coordinates"
                  value={dropoffInput}
                  onChange={(e) => handleDropoffChange(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>

            {/* Cargo Description */}
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                Cargo Description
              </label>
              <input
                type="text"
                placeholder="e.g. Electronics, machinery, household..."
                value={cargoType}
                onChange={(e) => setCargoType(e.target.value)}
                className="input-field"
                required
              />
            </div>

            {/* Weight & Volume dimensions */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Weight (KG)
                </label>
                <input
                  type="number"
                  placeholder="500"
                  value={weightKg || ''}
                  onChange={(e) => setWeightKg(+e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Volume (L x W x H CM)
                </label>
                <input
                  type="text"
                  placeholder="120 x 80 x 90"
                  value={volumeInput}
                  onChange={(e) => handleVolumeChange(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>

            {/* Vehicle configuration selection cards */}
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2.5">
                Vehicle Type
              </label>
              {/* Dropdown Menu for choosing any vehicle configuration */}
              <div className="mt-2.5">
                <select
                  value={form.vehicleType}
                  onChange={(e) => setForm(f => ({ ...f, vehicleType: e.target.value as any }))}
                  className="w-full p-3 bg-white text-black font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-slate-500 focus:ring-0 transition-all text-xs uppercase"
                >
                  <option value="TWO_WHEELER">Two Wheeler (up to 50 kg)</option>
                  <option value="THREE_WHEELER">Three Wheeler (up to 300 kg)</option>
                  <option value="MINI_TEMPO">Mini Tempo (up to 750 kg)</option>
                  <option value="PICKUP_TRUCK">Pickup Truck (up to 1.5 ton)</option>
                  <option value="CONTAINER_3TON">3-Ton Container (up to 3 ton)</option>
                  <option value="HEAVY_DUTY_TRUCK">Heavy Duty Truck (up to 15 ton)</option>
                </select>
              </div>
            </div>

            {/* Live Pricing Estimation Section */}
            {liveQuote && (
              <div className="bg-[#F4F3EF] p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">
                    Estimated fare
                  </span>
                  <span className="text-2xl font-serif font-[600] text-[#1A1A1A] tracking-tight block">
                    ₹ {formatPrice(liveQuote.totalPrice)}
                  </span>
                  <span className="text-[8px] font-bold text-slate-400 block mt-1">
                    Base ₹{liveQuote.basePrice} + distance ₹{liveQuote.distancePrice} + cargo ₹{liveQuote.cargoPrice}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">
                    Distance
                  </span>
                  <span className="text-xl font-black text-[#1A1A1A] block">
                    {liveQuote.distanceKm}
                  </span>
                  <span className="text-[9px] font-extrabold text-[#1A1A1A] uppercase tracking-widest block mt-0.5">
                    km
                  </span>
                </div>
              </div>
            )}

            {/* Confirm shipment button */}
            <button
              onClick={createBooking}
              className="btn-primary w-full py-3.5 mt-2 active:scale-[0.98] transition-transform font-bold text-sm tracking-wide rounded-xl"
            >
              Confirm & dispatch &rarr;
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: STATS + MY DISPATCHES LIST */}
        <div className="md:col-span-7 space-y-6">

          {/* Dynamic Mockup Stats Row */}
          <div className="grid grid-cols-3 gap-4 text-center md:text-left select-none">
            <div className="flex flex-col items-center md:items-start justify-center">
              <span className="text-3xl font-extrabold text-[#1A1A1A] block tracking-tight">
                {activeDispatches}
              </span>
              <span className="text-[9px] md:text-xs text-slate-400 font-bold uppercase tracking-wider mt-1 block">
                Active dispatches
              </span>
            </div>
            <div className="flex flex-col items-center md:items-start justify-center">
              <span className="text-3xl font-serif font-[600] text-[#1A1A1A] block tracking-tight">
                ₹{formatPrice(totalSpent)}
              </span>
              <span className="text-[9px] md:text-xs text-slate-400 font-bold uppercase tracking-wider mt-1 block">
                Spent this month
              </span>
            </div>
            <div className="flex flex-col items-center md:items-start justify-center">
              <span className="text-3xl font-extrabold text-[#1A1A1A] block tracking-tight">
                {totalShipments}
              </span>
              <span className="text-[9px] md:text-xs text-slate-400 font-bold uppercase tracking-wider mt-1 block">
                Total shipments
              </span>
            </div>
          </div>

          {/* MY DISPATCHES CARD */}
          <div className="bg-white border border-[#E8E6E0] p-6 rounded-2xl shadow-sm">
            {/* Card Header */}
            <div className="flex items-center justify-between mb-6 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-[#1A1A1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h2 className="text-xs font-black text-[#1A1A1A] uppercase tracking-widest">
                  My Dispatches
                </h2>
              </div>
              <button
                onClick={fetchBookings}
                className="text-[9px] font-black text-[#1A1A1A] uppercase tracking-widest hover:underline"
              >
                Refresh
              </button>
            </div>

            {/* Scrollable Listings Container */}
            <div className="space-y-6 max-h-[520px] overflow-y-auto pr-1">

              {/* SECTION: IN PROGRESS */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    In Progress
                  </span>
                  <div className="flex-1 border-t border-dashed border-[#E8E6E0]" />
                </div>

                {inProgress.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-200 bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-wider rounded-xl">
                    No active dispatches.
                  </div>
                ) : (
                  <div className="divide-y divide-[#E8E6E0]">
                    {inProgress.map((b) => (
                      <div key={b.id} className="py-5 first:pt-0 last:pb-0 space-y-4">
                        {/* 1st Line: ID & Status Badge */}
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm text-[#1A1A1A] select-all">
                            #CG-{b.id.slice(-5).toUpperCase()}
                          </span>
                          <span className={`px-2.5 py-1 text-[9px] font-extrabold uppercase rounded-lg border leading-none ${
                            b.status === 'IN_TRANSIT'
                              ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                              : 'bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0]'
                          }`}>
                            {b.status === 'IN_TRANSIT' ? 'In transit' : 'Pending'}
                          </span>
                        </div>

                        {/* 2nd Line: Location Route block with map icon */}
                        <div className="flex items-start gap-3 bg-[#F8F7F4] p-3 rounded-xl border border-[#E8E6E0]">
                          <div className="bg-white p-2 rounded-lg border border-[#E8E6E0] text-slate-500 shrink-0 mt-0.5">
                            <svg className="h-4 w-4 text-[#1A1A1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-extrabold text-[#1A1A1A]">
                              {getFriendlyLocationName(b.pickupLat, b.pickupLng)}
                            </div>
                            <div className="text-xs text-slate-400 font-bold flex items-center gap-1.5 mt-0.5">
                              <span>&rarr;</span>
                              <span>{getFriendlyLocationName(b.dropoffLat, b.dropoffLng)}</span>
                            </div>
                          </div>
                        </div>

                        {/* 3rd Line: Specs Pill tags bar */}
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="bg-[#F8F7F4] text-slate-600 text-[10px] font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-[#E8E6E0]">
                            <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10M21 16v-4a1 1 0 00-.1-.5l-3-3a1 1 0 00-.7-.3H13m8 8H3" />
                            </svg>
                            {formatVehicleName(b.vehicleType)}
                          </span>
                          <span className="bg-[#F8F7F4] text-slate-600 text-[10px] font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-[#E8E6E0]">
                            <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                            </svg>
                            {b.weightKg} kg
                          </span>
                          <span className="bg-[#1A1A1A] text-white text-[10px] font-black px-3.5 py-1.5 rounded-lg shadow-sm">
                            ₹ {formatPrice(b.price)}
                          </span>
                        </div>

                        {/* 4th Line: Dynamic OTP Container */}
                        {((b.status === 'ACCEPTED' && b.pickupOTP) || (b.status === 'IN_TRANSIT' && b.dropoffOTP)) && (
                          <div className="bg-[#F8F7F4] p-3.5 rounded-xl border border-[#E8E6E0] flex justify-between items-center">
                            <div>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">
                                {b.status === 'IN_TRANSIT' ? 'Dropoff OTP' : 'Pickup OTP'}
                              </span>
                              <span className="text-[8px] font-bold text-slate-400 block mt-1 leading-none">
                                Share with driver on arrival
                              </span>
                            </div>
                            <div className="text-xl font-serif font-[600] text-[#1A1A1A] tracking-[0.25em] pr-1.5 select-all leading-none">
                              {b.status === 'IN_TRANSIT' ? b.dropoffOTP : b.pickupOTP}
                            </div>
                          </div>
                        )}

                        {/* 5th Line: Actions Bar */}
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <button 
                            onClick={() => navigate(`/track/${b.id}`)}
                            className="py-2.5 px-4 bg-[#1A1A1A] hover:bg-black text-white text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5"
                          >
                            <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Live track
                          </button>
                          <button 
                            onClick={() => alert(`Driver Assigned:\nName: Rajesh Kumar\nPhone: +91 98765 43210\nStatus: Active shipment transporter.`)}
                            className="py-2.5 px-4 bg-[#1A1A1A] hover:bg-black text-white text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5"
                          >
                            <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            Call driver
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION: COMPLETED */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Completed
                  </span>
                  <div className="flex-1 border-t border-dashed border-[#E8E6E0]" />
                </div>

                {completed.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-200 bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-wider rounded-xl">
                    No completed shipments yet.
                  </div>
                ) : (
                  <div className="divide-y divide-[#E8E6E0]">
                    {completed.map((b) => (
                      <div key={b.id} className="py-5 first:pt-0 last:pb-0 space-y-4">
                        {/* 1st Line: ID & Status */}
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm text-[#1A1A1A] select-all">
                            #CG-{b.id.slice(-5).toUpperCase()}
                          </span>
                          <span className="px-2.5 py-1 text-[9px] font-extrabold uppercase rounded-lg border leading-none bg-[#E8E6E0] text-slate-600 border-[#D8D6D0]">
                            Delivered
                          </span>
                        </div>

                        {/* 2nd Line: Location Route block */}
                        <div className="flex items-start gap-3 bg-[#F8F7F4] p-3 rounded-xl border border-[#E8E6E0]">
                          <div className="bg-white p-2 rounded-lg border border-[#E8E6E0] text-slate-500 shrink-0 mt-0.5">
                            <svg className="h-4 w-4 text-[#1A1A1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-extrabold text-[#1A1A1A]">
                              {getFriendlyLocationName(b.pickupLat, b.pickupLng)}
                            </div>
                            <div className="text-xs text-slate-400 font-bold flex items-center gap-1.5 mt-0.5">
                              <span>&rarr;</span>
                              <span>{getFriendlyLocationName(b.dropoffLat, b.dropoffLng)}</span>
                            </div>
                          </div>
                        </div>

                        {/* 3rd Line: Specs Pills */}
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="bg-[#F8F7F4] text-slate-600 text-[10px] font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-[#E8E6E0]">
                            <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10M21 16v-4a1 1 0 00-.1-.5l-3-3a1 1 0 00-.7-.3H13m8 8H3" />
                            </svg>
                            {formatVehicleName(b.vehicleType)}
                          </span>
                          <span className="bg-[#F8F7F4] text-slate-600 text-[10px] font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-[#E8E6E0]">
                            <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                            </svg>
                            {b.weightKg} kg
                          </span>
                          <span className="bg-[#1A1A1A] text-white text-[10px] font-black px-3.5 py-1.5 rounded-lg shadow-sm">
                            ₹ {formatPrice(b.price)}
                          </span>
                        </div>

                        {/* 4th Line: Completed actions */}
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <button 
                            onClick={() => alert(`Receipt Info:\nBooking Reference: #CG-${b.id.toUpperCase()}\nPaid: ₹${b.price}\nVehicle Type: ${b.vehicleType}\nThank you for choosing CargoGo!`)}
                            className="py-2.5 px-4 border border-[#E8E6E0] text-slate-800 hover:border-slate-800 text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all text-center"
                          >
                            View receipt
                          </button>
                          <button 
                            onClick={() => handleRebook(b)}
                            className="py-2.5 px-4 bg-[#1A1A1A] text-white hover:bg-black text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all text-center"
                          >
                            Rebook
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default ShipperDashboard;
