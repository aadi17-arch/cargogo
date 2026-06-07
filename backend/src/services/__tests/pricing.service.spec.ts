import { calculatePrice, VEHICLE_RATES } from '../pricing.service';

describe('Pricing Service - calculatePrice', () => {
  it('should calculate price correctly based on weight when weight is higher than volumetric weight', () => {
    const input = {
      pickupLat: 19.0760,
      pickupLng: 72.8777,
      dropoffLat: 19.2183,
      dropoffLng: 72.9781,
      weightKg: 100,
      lengthCm: 50,
      widthCm: 50,
      heightCm: 50,
      vehicleType: 'MINI_TEMPO' as const,
    };

    const result = calculatePrice(input);

    // Volumetric weight: (50*50*50)/5000 = 25kg
    // Since weightKg (100kg) > volumetricWeight (25kg), chargeableWeight should be 100kg
    expect(result.chargeableWeight).toBe(100);
    expect(result.basePrice).toBe(VEHICLE_RATES.MINI_TEMPO.basePrice);
    expect(result.totalPrice).toBeGreaterThan(0);
  });

  it('should use volumetric weight as chargeable weight when volumetric weight is higher', () => {
    const input = {
      pickupLat: 19.0760,
      pickupLng: 72.8777,
      dropoffLat: 19.2183,
      dropoffLng: 72.9781,
      weightKg: 10,
      lengthCm: 100,
      widthCm: 100,
      heightCm: 100,
      vehicleType: 'MINI_TEMPO' as const,
    };

    const result = calculatePrice(input);

    // Volumetric weight: (100*100*100)/5000 = 200kg
    // Since volumetric (200kg) > weight (10kg), chargeableWeight should be 200kg
    expect(result.chargeableWeight).toBe(200);
  });
});
