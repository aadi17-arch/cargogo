import { haversineDistance } from "@/utils/haversine";

interface PricingInput {
    pickupLat: number,
    pickupLng: number,
    dropoffLat: number,
    dropoffLng: number,
    weightKg: number
    lengthCm: number;
    widthCm: number,
    heightCm: number,
    vehicleType: 'TWO_WHEELER' | 'THREE_WHEELER' | 'MINI_TEMPO' | 'PICKUP_TRUCK' | 'CONTAINER_3TON' | 'HEAVY_DUTY_TRUCK';
}
export const VEHICLE_RATES: Record<string, { basePrice: number; pricePerKm: number; costPerUnit: number }> = {
    TWO_WHEELER: { basePrice: 20, pricePerKm: 5, costPerUnit: 1 },
    THREE_WHEELER: { basePrice: 30, pricePerKm: 8, costPerUnit: 2 },
    MINI_TEMPO: { basePrice: 50, pricePerKm: 12, costPerUnit: 4 },
    PICKUP_TRUCK: { basePrice: 80, pricePerKm: 15, costPerUnit: 5 },
    CONTAINER_3TON: { basePrice: 150, pricePerKm: 20, costPerUnit: 7 },
    HEAVY_DUTY_TRUCK: { basePrice: 300, pricePerKm: 45, costPerUnit: 12 },
};
export const calculatePrice = (input: PricingInput & { distanceKm?: number }) => {
    const distanceKm = input.distanceKm !== undefined ? input.distanceKm : haversineDistance(
        input.pickupLat,
        input.pickupLng,
        input.dropoffLat,
        input.dropoffLng
    );
    const volumetricWeight = (input.lengthCm * input.widthCm * input.heightCm) / 5000;
    const chargeableWeight = Math.max(input.weightKg, volumetricWeight);
    const rate = VEHICLE_RATES[input.vehicleType];

    const subtotal = rate.basePrice + (rate.pricePerKm * distanceKm) + (rate.costPerUnit * chargeableWeight);
    
    // Peak hours: 8:00 - 10:00 AM (8, 9) & 5:00 - 8:00 PM (17, 18, 19)
    const currentHour = new Date().getHours();
    const isPeakHour = (currentHour >= 8 && currentHour < 10) || (currentHour >= 17 && currentHour < 20);
    const surgeMultiplier = isPeakHour ? 1.25 : 1.0;
    const price = subtotal * surgeMultiplier;

    return {
        distanceKm,
        volumetricWeight: Math.round(volumetricWeight * 100) / 100,
        chargeableWeight: Math.round(chargeableWeight * 100) / 100,
        basePrice: rate.basePrice,
        pricePerKm: rate.pricePerKm,
        costPerUnit: rate.costPerUnit,
        surgeMultiplier,
        totalPrice: Math.round(price * 100) / 100
    };
};
