import { z } from 'zod';

export const checkoutSchema = z.object({
  body: z.object({
    bookingId: z.string({ required_error: 'Booking ID is required' })
      .uuid('Invalid booking ID format'),
    paymentMethod: z.string({ required_error: 'Payment method is required' }),
    amount: z.number({ required_error: 'Amount is required' })
      .positive('Amount must be positive'),
  }),
});
