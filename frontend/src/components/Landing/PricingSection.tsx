import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Receipt, ArrowRight, Truck, Scale, MapPin } from 'lucide-react';
import Card from '@/components/ui/Card';
import { VEHICLE_RATES } from '@/utils/pricing';

const FLEET_CARDS = [
  {
    title: 'Mini Tempo',
    capacity: 'Up to 500 kg',
    description: 'Best for boxes, small appliances, and household items. Easily moves through narrow city streets.',
    basePrice: '₹350',
    rate: '₹14 / km'
  },
  {
    title: 'Pickup Truck',
    capacity: 'Up to 1.5 Tons',
    description: 'Great for furniture, timber, and market stock with an open back for easy loading.',
    basePrice: '₹600',
    rate: '₹18 / km'
  },
  {
    title: '3-Ton Container',
    capacity: 'Up to 3.0 Tons',
    description: 'Enclosed truck for large commercial goods, electronics, and heavy wholesale cargo.',
    basePrice: '₹1,200',
    rate: '₹25 / km'
  }
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

  // Automatically adjust recommended vehicle type based on single weight input
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
          <span className="text-xs font-bold text-slate-500">
            Price Calculator
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 font-heading">
            Check Your Trip Cost
          </h2>
          <p className="text-sm font-medium text-slate-600 font-body">
            Get an instant estimate based directly on your cargo weight and travel distance.
          </p>
        </div>

        {/* 2-Column Calculator Form & Live Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-16">
          {/* Left Form Inputs */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              {/* Single Clean Weight Input */}
              <div className="text-left space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Approx Weight (kg)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400">
                    <Scale size={16} />
                  </span>
                  <input
                    type="number"
                    value={form.weightKg}
                    onChange={(e) => setForm(prev => ({ ...prev, weightKg: Math.max(1, +e.target.value) }))}
                    className="w-full h-10 pl-9 pr-12 bg-white border border-slate-200 rounded-md text-slate-900 text-sm font-bold focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-body"
                    required
                    min={1}
                  />
                  <span className="absolute right-3.5 text-xs font-bold text-slate-400 font-heading">kg</span>
                </div>
              </div>

              {/* Transit Distance Input */}
              <div className="text-left space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Distance (km)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400">
                    <MapPin size={16} />
                  </span>
                  <input
                    type="number"
                    value={form.distanceKm}
                    onChange={(e) => setForm(prev => ({ ...prev, distanceKm: Math.max(1, +e.target.value) }))}
                    className="w-full h-10 pl-9 pr-12 bg-white border border-slate-200 rounded-md text-slate-900 text-sm font-bold focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-body"
                    required
                    min={1}
                  />
                  <span className="absolute right-3.5 text-xs font-bold text-slate-400 font-heading">km</span>
                </div>
              </div>

              {/* Vehicle Selection */}
              <div className="text-left space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Truck Type
                </label>
                <select
                  value={form.vehicleType}
                  onChange={(e) => setForm(prev => ({ ...prev, vehicleType: e.target.value as any }))}
                  className="w-full h-10 px-3.5 bg-white border border-slate-200 rounded-md text-slate-900 text-xs font-bold focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-body cursor-pointer"
                >
                  <option value="MINI_TEMPO">Mini Tempo (Up to 500 kg)</option>
                  <option value="PICKUP_TRUCK">Pickup Truck (Up to 1.5 Tons)</option>
                  <option value="CONTAINER_3TON">3-Ton Container (Up to 3.0 Tons)</option>
                </select>
              </div>
            </div>

            <div className="text-left text-xs text-slate-500 pt-2 border-t border-slate-100">
              * Exact road distance calculated with zero middleman charges.
            </div>
          </div>

          <Card size="lg" className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div className="space-y-4 text-left">
              <h3 className="text-base font-bold text-slate-900 font-heading border-b border-slate-100 pb-3 flex items-center gap-2">
                <Receipt size={18} className="text-slate-700" />
                <span>Price Details</span>
              </h3>

              {quote && (
                <div className="space-y-3 text-xs text-slate-600 font-body">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-500">Base Fare:</span>
                    <span className="font-bold text-slate-900 font-heading">₹{quote.basePrice}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-500">Distance ({quote.distanceKm} km):</span>
                    <span className="font-bold text-slate-900 font-heading">₹{quote.distanceTotal}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-500">Weight Charge ({quote.weightKg} kg):</span>
                    <span className="font-bold text-slate-900 font-heading">₹{quote.weightTotal}</span>
                  </div>
                </div>
              )}

              {/* Total Estimate */}
              <div className="border-t border-slate-100 pt-4 text-left">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-slate-900 font-heading">Estimated Total</span>
                  <span className="text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
                    ₹{quote?.totalPrice || 0}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Includes driver allowance & fuel surcharges.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate(dest)}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <span>{isAuthenticated ? 'Book This Load' : 'Get Started Now'}</span>
              <ArrowRight size={14} />
            </button>
          </Card>
        </div>

        {/* Fleet & Vehicle Options Grid */}
        <div className="space-y-6 text-left">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-xl font-bold text-slate-900 font-heading">
              Available Trucks
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
                      <span className="text-[10px] font-bold text-slate-500">{f.capacity}</span>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600 font-body">{f.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400">Base Fare</span>
                    <span className="text-sm font-extrabold text-slate-900 font-heading">{f.basePrice}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] font-bold text-slate-400">Rate per km</span>
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
