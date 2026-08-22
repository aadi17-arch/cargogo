import { useState, useEffect } from 'react';
import { ChevronRight, ArrowLeft, Scale, Truck } from 'lucide-react';
import { geocodingService } from '@/services/geocoding.service';
import { calculateQuote } from '@/utils/pricing';
import Button from '@/components/ui/Button';

export interface BookingFormData {
  pickupLat: number | null;
  pickupLng: number | null;
  pickupAddress: string;
  dropoffLat: number | null;
  dropoffLng: number | null;
  dropoffAddress: string;
  cargoType: string;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  vehicleType: 'MINI_TEMPO' | 'PICKUP_TRUCK' | 'CONTAINER_3TON';
}

interface BookingFormProps {
  form: BookingFormData;
  setForm: React.Dispatch<React.SetStateAction<BookingFormData>>;
  pickupSearch: string;
  setPickupSearch: (val: string) => void;
  dropoffSearch: string;
  setDropoffSearch: (val: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const VEHICLE_RATES: Record<string, { title: string; capacity: string }> = {
  MINI_TEMPO: { title: 'Mini Tempo', capacity: 'Up to 500 kg' },
  PICKUP_TRUCK: { title: 'Pickup Truck', capacity: 'Up to 1.5 Tons' },
  CONTAINER_3TON: { title: '3-Ton Container', capacity: 'Up to 3.0 Tons' },
};

export default function BookingForm({
  form,
  setForm,
  pickupSearch,
  setPickupSearch,
  dropoffSearch,
  setDropoffSearch,
  onSubmit,
  isLoading
}: BookingFormProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [pickupResults, setPickupResults] = useState<any[]>([]);
  const [dropoffResults, setDropoffResults] = useState<any[]>([]);
  const [searchingPickup, setSearchingPickup] = useState(false);
  const [searchingDropoff, setSearchingDropoff] = useState(false);

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
    } catch {
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

  return (
    <>
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold font-heading text-slate-900 tracking-tight">New Booking</h3>
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

          <div className="relative space-y-1.5 text-left">
            <label className="block text-xs font-bold text-slate-700">Pickup</label>
            <input
              placeholder="Enter pickup address"
              value={pickupSearch}
              onChange={(e) => setPickupSearch(e.target.value)}
              className="w-full h-10 px-3.5 bg-white border border-slate-200 rounded-md text-slate-900 text-xs font-medium focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400"
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

          <div className="relative space-y-1.5 text-left pt-0.5">
            <label className="block text-xs font-bold text-slate-700">Drop-off</label>
            <input
              placeholder="Enter drop-off address"
              value={dropoffSearch}
              onChange={(e) => setDropoffSearch(e.target.value)}
              className="w-full h-10 px-3.5 bg-white border border-slate-200 rounded-md text-slate-900 text-xs font-medium focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400"
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

          <Button
            type="button"
            disabled={!form.pickupLat || !form.dropoffLat}
            onClick={() => setStep(2)}
            fullWidth
            className="h-10 mt-3"
          >
            <span>Next</span>
            <ChevronRight size={14} />
          </Button>
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
                  onChange={(e) => setForm(prev => ({ ...prev, weightKg: Math.max(1, +e.target.value) }))}
                  className="w-full h-10 pl-9 pr-8 bg-white border border-slate-200 rounded-md text-slate-900 text-xs font-bold focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-body"
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
                onChange={(e) => setForm(prev => ({ ...prev, cargoType: e.target.value }))}
                className="w-full h-10 px-3.5 bg-white border border-slate-200 rounded-md text-slate-900 text-xs font-medium focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-body placeholder:text-slate-400"
              />
            </div>
          </div>

          <Button
            type="button"
            onClick={() => setStep(3)}
            fullWidth
            className="h-10 mt-3"
          >
            <span>Next</span>
            <ChevronRight size={14} />
          </Button>
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

          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 my-2">
            {Object.keys(VEHICLE_RATES).map((key) => {
              const isSelected = form.vehicleType === key;
              const opt = VEHICLE_RATES[key];
              const estPrice = getEstimatedPrice(key);

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, vehicleType: key as any }))}
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

          <Button
            type="button"
            onClick={onSubmit}
            isLoading={isLoading}
            fullWidth
            className="h-10 mt-2"
          >
            Book
          </Button>
        </div>
      )}
    </>
  );
}
