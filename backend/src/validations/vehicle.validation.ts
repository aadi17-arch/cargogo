import { z } from 'zod';

export const updateVehicleSchema = z.object({
  body: z.object({
    type: z.enum([
      'TWO_WHEELER',
      'THREE_WHEELER',
      'MINI_TEMPO',
      'PICKUP_TRUCK',
      'CONTAINER_3TON',
      'HEAVY_DUTY_TRUCK'
    ]).optional(),
    plateNumber: z.string().min(3, 'Plate number must be at least 3 characters').max(20).optional(),
    capacityKg: z.number().positive('Capacity must be positive').optional(),
    basePrice: z.number().nonnegative('Base price cannot be negative').optional(),
    pricePerKm: z.number().nonnegative('Price per km cannot be negative').optional(),
    costPerUnit: z.number().nonnegative('Cost per unit cannot be negative').optional(),
  })
});
