import { calculateDistance } from './geo';

export const VEHICLE_RATES: Record<string, { basePrice: number; pricePerKm: number; costPerUnit: number }> = {
  MINI_TEMPO:     { basePrice: 50,  pricePerKm: 12, costPerUnit: 4 },
  PICKUP_TRUCK:   { basePrice: 80,  pricePerKm: 15, costPerUnit: 5 },
  CONTAINER_3TON: { basePrice: 150, pricePerKm: 20, costPerUnit: 7 },
};

export interface QuoteResult {
  distanceKm: number;
  volumetric: number;
  chargeable: number;
  basePrice: number;
  pricePerKm: number;
  costPerUnit: number;
  estimated: number;
}

export interface QuoteInput {
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  vehicleType: string;
}

/** Calculates a price quote — single source of truth for frontend pricing logic. */
export function calculateQuote(input: QuoteInput): QuoteResult {
  const distanceKm = calculateDistance(input.pickupLat, input.pickupLng, input.dropoffLat, input.dropoffLng);
  const volumetric = (input.lengthCm * input.widthCm * input.heightCm) / 5000;
  const chargeable = Math.max(input.weightKg, volumetric);
  const rate = VEHICLE_RATES[input.vehicleType] ?? VEHICLE_RATES.MINI_TEMPO;
  const price = rate.basePrice + rate.pricePerKm * distanceKm + rate.costPerUnit * chargeable;
  return {
    distanceKm:  Math.round(distanceKm  * 100) / 100,
    volumetric:  Math.round(volumetric  * 100) / 100,
    chargeable:  Math.round(chargeable  * 100) / 100,
    basePrice:   rate.basePrice,
    pricePerKm:  rate.pricePerKm,
    costPerUnit: rate.costPerUnit,
    estimated:   Math.round(price * 100) / 100,
  };
}
