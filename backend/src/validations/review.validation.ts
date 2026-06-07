import { z } from 'zod';

export const createReviewSchema = z.object({
  body: z.object({
    bookingId: z.string({ required_error: 'Booking ID is required' })
      .uuid('Invalid booking ID format'),
    rating: z.number({ required_error: 'Rating is required' })
      .int()
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating cannot be more than 5'),
    comment: z.string().optional(),
  }),
});

export const fileDisputeSchema = z.object({
  body: z.object({
    bookingId: z.string({ required_error: 'Booking ID is required' })
      .uuid('Invalid booking ID format'),
    reason: z.string({ required_error: 'Reason for dispute is required' })
      .min(5, 'Reason must be at least 5 characters long'),
  }),
});
