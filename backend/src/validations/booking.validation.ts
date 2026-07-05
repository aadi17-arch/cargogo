import { z } from 'zod';

export const createBookingSchema = z.object({
  body: z.object({
    pickupLat: z.number({ required_error: 'Pickup latitude is required' })
      .min(-90).max(90),
    pickupLng: z.number({ required_error: 'Pickup longitude is required' })
      .min(-180).max(180),
    pickupAddress: z.string({ required_error: 'Pickup address is required' }).min(1),
    dropoffLat: z.number({ required_error: 'Dropoff latitude is required' })
      .min(-90).max(90),
    dropoffLng: z.number({ required_error: 'Dropoff longitude is required' })
      .min(-180).max(180),
    dropoffAddress: z.string({ required_error: 'Dropoff address is required' }).min(1),
    cargoType: z.string({ required_error: 'Cargo type is required' })
      .min(2, 'Cargo type must be at least 2 characters'),
    weightKg: z.number({ required_error: 'Weight in kg is required' })
      .positive('Weight must be positive'),
    lengthCm: z.number({ required_error: 'Length in cm is required' })
      .positive('Length must be positive'),
    widthCm: z.number({ required_error: 'Width in cm is required' })
      .positive('Width must be positive'),
    heightCm: z.number({ required_error: 'Height in cm is required' })
      .positive('Height must be positive'),
    vehicleType: z.enum([
      'TWO_WHEELER',
      'THREE_WHEELER',
      'MINI_TEMPO',
      'PICKUP_TRUCK',
      'CONTAINER_3TON',
      'HEAVY_DUTY_TRUCK',
    ], { required_error: 'Vehicle type is required' }),

    // NEW: Optional scheduled booking fields — entirely optional for backward compat
    bookingType: z.enum(['INSTANT', 'SCHEDULED']).optional(),
    scheduledAt: z.string().datetime({ offset: true }).optional(),  // ISO 8601 string from frontend
    scheduledUntil: z.string().datetime({ offset: true }).optional(),
  }).refine(data => data.pickupLat !== data.dropoffLat || data.pickupLng !== data.dropoffLng, {
    message: 'Pickup and dropoff coordinates cannot be identical',
    path: ['dropoffLat']
  }),
});
