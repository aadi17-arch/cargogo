import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' })
      .email('Invalid email format'),
    password: z.string({ required_error: 'Password is required' })
      .min(6, 'Password must be at least 6 characters'),
    name: z.string({ required_error: 'Name is required' })
      .min(2, 'Name must be at least 2 characters'),
    role: z.enum(['SHIPPER', 'DRIVER'], {
      required_error: 'Role must be either SHIPPER or DRIVER',
    }),
    vehicle: z.object({
      type: z.enum(['MINI_TEMPO', 'PICKUP_TRUCK', 'CONTAINER_3TON']),
      plateNumber: z.string().min(3, 'Plate number must be valid'),
      capacityKg: z.number().positive('Capacity must be positive'),
    }).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' })
      .email('Invalid email format'),
    password: z.string({ required_error: 'Password is required' }),
  }),
});
