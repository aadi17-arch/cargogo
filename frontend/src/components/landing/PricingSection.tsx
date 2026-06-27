import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Receipt } from 'lucide-react';
import { VEHICLE_RATES } from '@/utils/pricing';
import { FleetSection } from './FeatureSections';


export default function PricingSection() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const dest = isAuthenticated ? (user?.role === 'DRIVER' ? '/driver' : '/shipper') : '/register';

  const [form, setForm] = useState({
    weightKg: 50, lengthCm: 100, widthCm: 60, heightCm: 40,
    vehicleType: 'MINI_TEMPO' as keyof typeof VEHICLE_RATES,
    distanceKm: 15,
  });
  const [quote, setQuote] = useState<any>(null);

  const calculateQuote = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const volumetric = (form.lengthCm * form.widthCm * form.heightCm) / 5000;
    const chargeable = Math.max(form.weightKg, volumetric);
    const rate = VEHICLE_RATES[form.vehicleType] ?? VEHICLE_RATES.MINI_TEMPO;
    const price = rate.basePrice + rate.pricePerKm * form.distanceKm + rate.costPerUnit * chargeable;
    setQuote({
      distanceKm: form.distanceKm, volumetric: Math.round(volumetric * 100) / 100,
      chargeable: Math.round(chargeable * 100) / 100, basePrice: rate.basePrice,
      pricePerKm: rate.pricePerKm, costPerUnit: rate.costPerUnit,
      estimated: Math.round(price * 100) / 100,
    });
  };

  return (
    <section id="pricing" className="py-20 px-6 border-b border-[var(--color-border)]" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-[1750px] mx-auto px-4 sm:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>Instant Delivery Price Estimator</h2>
          <p className="text-md font-medium" style={{ color: 'var(--color-text-muted)' }}>Get transparent pricing instantly. Adjust details below to see changes in real-time.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Calculator Form */}
          <form onSubmit={calculateQuote} className="lg:col-span-7 p-8 rounded-[var(--radius-card)] border bg-[var(--color-card)] space-y-6 shadow-sm flex flex-col justify-between" style={{ borderColor: 'var(--color-border)', borderWidth: 'var(--border-width)' }}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                {[
                  { key: 'weightKg', label: 'Weight (kg)', min: 1 },
                  { key: 'distanceKm', label: 'Distance (km)', min: 1 },
                ].map(({ key, label, min }) => (
                  <div key={key}>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)' }}>{label}</label>
                    <input type="number" value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: Math.max(min, +e.target.value) })} className="input-field px-4 py-3 bg-[var(--color-background)] w-full border rounded-[var(--radius-card)]" style={{ borderColor: 'var(--color-border)' }} required min={min} />
                  </div>
                ))}
              </div>

              <div className="text-left space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)' }}>Dimensions (Length / Width / Height)</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'lengthCm', label: 'L' },
                    { key: 'widthCm', label: 'W' },
                    { key: 'heightCm', label: 'H' },
                  ].map(({ key, label }) => (
                    <div key={key} className="relative flex items-center">
                      <input type="number" placeholder={label} value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: Math.max(1, +e.target.value) })} className="input-field pr-8 px-3.5 py-3 bg-[var(--color-background)] text-center w-full border rounded-[var(--radius-card)]" style={{ borderColor: 'var(--color-border)' }} required min={1} />
                      <span className="absolute right-2.5 text-[10px] font-bold text-slate-400">cm</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-left space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)' }}>Vehicle Type</label>
                <select value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value as any })} className="input-field px-4 py-3 bg-[var(--color-background)] w-full border rounded-[var(--radius-card)] focus:outline-none" style={{ borderColor: 'var(--color-border)' }}>
                  <option value="MINI_TEMPO">Mini Tempo (Up to 500 kg)</option>
                  <option value="PICKUP_TRUCK">Pickup Truck (Up to 1.5 Tons)</option>
                  <option value="CONTAINER_3TON">3-Ton Container (Up to 3.0 Tons)</option>
                </select>
              </div>
            </div>
            <button type="submit" className="demo-btn-primary w-full py-3.5 mt-6">
              Calculate Estimate Price
            </button>
          </form>

          {/* Result Panel */}
          <div className="lg:col-span-5 h-full">
            <div className="p-8 rounded-[var(--radius-card)] border bg-[var(--color-card)] space-y-6 shadow-sm h-full flex flex-col justify-between" style={{ borderColor: 'var(--color-border)', borderWidth: 'var(--border-width)' }}>
              {!quote ? (
                <div className="flex flex-col items-center justify-center text-center py-16 space-y-4 my-auto h-full">
                  <div className="p-4 rounded-full bg-slate-100 text-slate-400"><Receipt size={32} /></div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-base text-[var(--color-text-main)]">No Quote Calculated</h4>
                    <p className="text-xs max-w-[280px]" style={{ color: 'var(--color-text-muted)' }}>Fill out the details on the left and click <strong>"Calculate Estimate Price"</strong> to see your detailed breakdown.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold pb-2 border-b border-[var(--color-border)] text-left" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>Price Breakdown Details</h3>
                    <div className="space-y-3.5 text-sm text-left" style={{ color: 'var(--color-text-muted)' }}>
                      {[
                        { label: 'Base Fare:', value: `₹${quote.basePrice}` },
                        { label: `Distance Cost (${quote.distanceKm} km):`, value: `₹${quote.pricePerKm * quote.distanceKm}` },
                        { label: `Billed Weight Charge (${quote.chargeable} kg):`, value: `₹${Math.round(quote.costPerUnit * quote.chargeable)}` },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between items-center">
                          <span className="font-medium text-slate-500">{label}</span>
                          <span className="font-bold text-[var(--color-text-main)]">{value}</span>
                        </div>
                      ))}
                      <p className="text-[10px] leading-relaxed pt-1 border-t border-dashed border-[var(--color-border)]" style={{ color: 'var(--color-text-muted)' }}>
                        * Billed weight is calculated as the larger of actual weight ({form.weightKg}kg) and package volume weight ({quote.volumetric}kg).
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4 pt-4 border-t border-[var(--color-border)]">
                    <div className="flex justify-between items-center text-left">
                      <span className="text-sm font-bold text-[var(--color-text-main)]">Estimated Total:</span>
                      <span className="text-3xl font-extrabold text-[var(--color-text-main)]">₹{quote.estimated}</span>
                    </div>
                    <button type="button" onClick={() => navigate(dest)} className="demo-btn-primary w-full py-3.5">
                      {isAuthenticated ? (user?.role === 'DRIVER' ? 'Go to Dashboard' : 'Proceed to Book Delivery') : 'Proceed to Book Delivery'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <FleetSection />
      </div>
    </section>
  );
}
