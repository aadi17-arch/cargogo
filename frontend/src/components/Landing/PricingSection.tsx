import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Receipt, ArrowRight, Truck, Scale, MapPin } from 'lucide-react';
import { VEHICLE_RATES } from '@/utils/pricing';

const FLEET_CARDS = [
  {
    title: 'Mini Tempo',
    capacity: 'Up to 500 kg',
    description: 'Swift local deliveries for boxes, light goods, and small packages. Easy navigation in dense streets.',
    basePrice: '₹350',
    rate: '₹14 / km'
  },
  {
    title: 'Pickup Truck',
    capacity: 'Up to 1.5 Tons',
    description: 'Ideal for commercial stock, timber, furniture, and industrial items with an open deck layout.',
    basePrice: '₹600',
    rate: '₹18 / km'
  },
  {
    title: '3-Ton Container',
    capacity: 'Up to 3.0 Tons',
    description: 'Fully enclosed metal container for high-value freight, electronics, and bulk wholesale logistics.',
    basePrice: '₹1,200',
    rate: '₹25 / km'
  }
];

const WEIGHT_PRESETS = [
  { label: '25 kg', value: 25, desc: 'Small Parcel' },
  { label: '100 kg', value: 100, desc: 'Carton Batch' },
  { label: '350 kg', value: 350, desc: 'Heavy Freight' },
  { label: '800 kg', value: 800, desc: 'Commercial Load' },
  { label: '1500 kg', value: 1500, desc: 'Bulk Cargo' },
];

export default function PricingSection() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const dest = isAuthenticated ? (user?.role === 'DRIVER' ? '/driver' : '/shipper') : '/register';

  const [form, setForm] = useState({
    weightKg: 100,
    vehicleType: 'MINI_TEMPO' as keyof typeof VEHICLE_RATES,
    distanceKm: 15,
  });

  const [quote, setQuote] = useState<any>(null);

  // Automatically suggest or scale vehicle based on weight
  useEffect(() => {
    if (form.weightKg > 1500) {
      setForm(prev => ({ ...prev, vehicleType: 'CONTAINER_3TON' }));
    } else if (form.weightKg > 500 && form.vehicleType === 'MINI_TEMPO') {
      setForm(prev => ({ ...prev, vehicleType: 'PICKUP_TRUCK' }));
    }
  }, [form.weightKg]);

  const computeQuote = () => {
    const rate = VEHICLE_RATES[form.vehicleType] ?? VEHICLE_RATES.MINI_TEMPO;
    const price = rate.basePrice + (rate.pricePerKm * form.distanceKm) + (rate.costPerUnit * form.weightKg);
    setQuote({
      distanceKm: form.distanceKm,
      weightKg: form.weightKg,
      basePrice: rate.basePrice,
      pricePerKm: rate.pricePerKm,
      costPerUnit: rate.costPerUnit,
      distanceTotal: Math.round(rate.pricePerKm * form.distanceKm),
      weightTotal: Math.round(rate.costPerUnit * form.weightKg),
      estimated: Math.round(price),
    });
  };

  useEffect(() => {
    computeQuote();
  }, [form]);

  return (
    <section id="pricing" className="py-20 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Instant Calculator
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 font-heading">
            Live Freight Estimator
          </h2>
          <p className="text-sm font-medium text-slate-600 font-body">
            Instant, transparent quotes based directly on your cargo weight and distance.
          </p>
        </div>

        {/* 2-Column Calculator Form & Live Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-16">
          {/* Left Form Inputs */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              {/* Weight Presets & Input */}
              <div className="text-left space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Cargo Weight (kg)
                  </label>
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    {form.weightKg} kg
                  </span>
                </div>

                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400">
                    <Scale size={16} />
                  </span>
                  <input
                    type="number"
                    value={form.weightKg}
                    onChange={(e) => setForm(prev => ({ ...prev, weightKg: Math.max(1, +e.target.value) }))}
                    className="w-full h-11 pl-10 pr-12 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm font-bold focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-body"
                    required
                    min={1}
                  />
                  <span className="absolute right-3.5 text-xs font-bold text-slate-400 font-heading">kg</span>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {WEIGHT_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, weightKg: p.value }))}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer border ${
                        form.weightKg === p.value
                          ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Distance Slider & Input */}
              <div className="text-left space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Transit Distance (km)
                  </label>
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    {form.distanceKm} km
                  </span>
                </div>

                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400">
                    <MapPin size={16} />
                  </span>
                  <input
                    type="number"
                    value={form.distanceKm}
                    onChange={(e) => setForm(prev => ({ ...prev, distanceKm: Math.max(1, +e.target.value) }))}
                    className="w-full h-11 pl-10 pr-12 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm font-bold focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-body"
                    required
                    min={1}
                  />
                  <span className="absolute right-3.5 text-xs font-bold text-slate-400 font-heading">km</span>
                </div>

                <input
                  type="range"
                  min={1}
                  max={200}
                  value={form.distanceKm}
                  onChange={(e) => setForm(prev => ({ ...prev, distanceKm: +e.target.value }))}
                  className="w-full accent-slate-950 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
              </div>

              {/* Vehicle Selection */}
              <div className="text-left space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Vehicle Type
                </label>
                <select
                  value={form.vehicleType}
                  onChange={(e) => setForm(prev => ({ ...prev, vehicleType: e.target.value as any }))}
                  className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs font-bold focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-body cursor-pointer"
                >
                  <option value="MINI_TEMPO">Mini Tempo (Up to 500 kg)</option>
                  <option value="PICKUP_TRUCK">Pickup Truck (Up to 1.5 Tons)</option>
                  <option value="CONTAINER_3TON">3-Ton Container (Up to 3.0 Tons)</option>
                </select>
              </div>
            </div>

            <div className="text-left text-xs text-slate-500 pt-2 border-t border-slate-100">
              * Direct road distance calculated with zero middleman commissions.
            </div>
          </div>

          {/* Right Summary Card */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4 text-left">
              <h3 className="text-base font-bold text-slate-900 font-heading border-b border-slate-100 pb-3 flex items-center gap-2">
                <Receipt size={18} className="text-slate-700" />
                <span>Estimate Breakdown</span>
              </h3>

              {quote && (
                <div className="space-y-3 text-xs text-slate-600 font-body">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-500">Base Dispatch Rate:</span>
                    <span className="font-bold text-slate-900 font-heading">₹{quote.basePrice}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-500">Distance ({quote.distanceKm} km @ ₹{quote.pricePerKm}/km):</span>
                    <span className="font-bold text-slate-900 font-heading">₹{quote.distanceTotal}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-500">Weight Charge ({quote.weightKg} kg):</span>
                    <span className="font-bold text-slate-900 font-heading">₹{quote.weightTotal}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center text-left">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Estimated Fare</span>
                <span className="text-3xl font-black text-slate-950 font-heading">
                  ₹{quote?.estimated || 0}
                </span>
              </div>

              <button
                type="button"
                onClick={() => navigate(dest)}
                className="w-full h-11 px-6 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <span>{isAuthenticated ? 'Go to Dashboard' : 'Proceed to Book Delivery'}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Fleet & Vehicle Options Grid */}
        <div className="space-y-6 text-left">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-xl font-bold text-slate-900 font-heading">
              Available Fleet Options
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FLEET_CARDS.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-lg border border-slate-200 bg-white flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-slate-100 text-slate-800 shrink-0">
                      <Truck size={20} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 font-heading">{f.title}</h4>
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{f.capacity}</span>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600 font-body">{f.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Base Fare</span>
                    <span className="text-sm font-extrabold text-slate-900 font-heading">{f.basePrice}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Distance Rate</span>
                    <span className="text-sm font-extrabold text-slate-900 font-heading">{f.rate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
