import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Receipt, ArrowRight, Truck } from 'lucide-react';
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

export default function PricingSection() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const dest = isAuthenticated ? (user?.role === 'DRIVER' ? '/driver' : '/shipper') : '/register';

  const [form, setForm] = useState({
    weightKg: 50,
    lengthCm: 100,
    widthCm: 60,
    heightCm: 40,
    vehicleType: 'MINI_TEMPO' as keyof typeof VEHICLE_RATES,
    distanceKm: 15,
  });

  const [quote, setQuote] = useState<any>(null);

  const computeQuote = () => {
    const volumetric = (form.lengthCm * form.widthCm * form.heightCm) / 5000;
    const chargeable = Math.max(form.weightKg, volumetric);
    const rate = VEHICLE_RATES[form.vehicleType] ?? VEHICLE_RATES.MINI_TEMPO;
    const price = rate.basePrice + rate.pricePerKm * form.distanceKm + rate.costPerUnit * chargeable;
    setQuote({
      distanceKm: form.distanceKm,
      volumetric: Math.round(volumetric * 10) / 10,
      chargeable: Math.round(chargeable * 10) / 10,
      basePrice: rate.basePrice,
      pricePerKm: rate.pricePerKm,
      costPerUnit: rate.costPerUnit,
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
            Volumetric Price Estimator
          </h2>
          <p className="text-sm font-medium text-slate-600 font-body">
            Transparent quotes calculated in real time based on dimensions, weight, and distance.
          </p>
        </div>

        {/* 2-Column Calculator Form & Live Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-16">
          {/* Left Form Inputs */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={form.weightKg}
                    onChange={(e) => setForm(prev => ({ ...prev, weightKg: Math.max(1, +e.target.value) }))}
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs font-bold focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-body"
                    required
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Distance (km)
                  </label>
                  <input
                    type="number"
                    value={form.distanceKm}
                    onChange={(e) => setForm(prev => ({ ...prev, distanceKm: Math.max(1, +e.target.value) }))}
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs font-bold focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-body"
                    required
                    min={1}
                  />
                </div>
              </div>

              <div className="text-left space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Package Dimensions (L × W × H in cm)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'lengthCm', label: 'Length' },
                    { key: 'widthCm', label: 'Width' },
                    { key: 'heightCm', label: 'Height' },
                  ].map(({ key, label }) => (
                    <div key={key} className="relative flex items-center">
                      <input
                        type="number"
                        placeholder={label}
                        value={(form as any)[key]}
                        onChange={(e) => setForm(prev => ({ ...prev, [key]: Math.max(1, +e.target.value) }))}
                        className="w-full h-10 px-3 pr-8 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs font-bold focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-body"
                        required
                        min={1}
                      />
                      <span className="absolute right-2.5 text-[10px] font-bold text-slate-400">cm</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-left space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Vehicle Type
                </label>
                <select
                  value={form.vehicleType}
                  onChange={(e) => setForm(prev => ({ ...prev, vehicleType: e.target.value as any }))}
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs font-bold focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-body cursor-pointer"
                >
                  <option value="MINI_TEMPO">Mini Tempo (Up to 500 kg)</option>
                  <option value="PICKUP_TRUCK">Pickup Truck (Up to 1.5 Tons)</option>
                  <option value="CONTAINER_3TON">3-Ton Container (Up to 3.0 Tons)</option>
                </select>
              </div>
            </div>

            <div className="text-left text-xs text-slate-500 pt-2 border-t border-slate-100">
              * Charges apply based on whichever is higher: physical cargo weight or volumetric mass.
            </div>
          </div>

          {/* Right Summary Card */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4 text-left">
              <h3 className="text-base font-bold text-slate-900 font-heading border-b border-slate-100 pb-3 flex items-center gap-2">
                <Receipt size={18} className="text-slate-700" />
                <span>Quote Summary</span>
              </h3>

              {quote && (
                <div className="space-y-3 text-xs text-slate-600 font-body">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-500">Base Fare:</span>
                    <span className="font-bold text-slate-900 font-heading">₹{quote.basePrice}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-500">Distance ({quote.distanceKm} km):</span>
                    <span className="font-bold text-slate-900 font-heading">₹{quote.pricePerKm * quote.distanceKm}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-500">Billed Weight ({quote.chargeable} kg):</span>
                    <span className="font-bold text-slate-900 font-heading">₹{Math.round(quote.costPerUnit * quote.chargeable)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200 text-slate-400 text-[11px]">
                    <span>Volumetric Equivalent:</span>
                    <span>{quote.volumetric} kg</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center text-left">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Estimated Total</span>
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
