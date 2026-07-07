import { Router } from 'express';
import { create, getBookingsById, getMyBookings, confirmPickup, confirmDropOff, getPending, accept, complete, getInvoiceDetail, cancel, commitScheduled, getScheduledJobs, getAvailableJobs } from '@/controllers/booking.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { requiredRole } from '@/middleware/role.middleware';
import { validateRequest } from '@/middleware/validate.middleware';
import { createBookingSchema } from '@/validations/booking.validation';
import { idempotency } from '@/middleware/idempotency.middleware';
import { otpLimiter } from '@/middleware/rate-limit.middleware';
const r = Router();

r.post('/createBooking', authenticate, requiredRole('SHIPPER'),idempotency,validateRequest(createBookingSchema) ,create);
r.get('/my', authenticate, getMyBookings);
r.get('/pending', authenticate, requiredRole('DRIVER'), getPending);

// Scheduled booking routes (defined before wildcard id)
r.get('/scheduled/upcoming', authenticate, requiredRole('DRIVER'), getScheduledJobs);
r.get('/scheduled/available', authenticate, requiredRole('DRIVER'), getAvailableJobs);

r.get('/:id', authenticate, getBookingsById);
r.post('/:id/accept', authenticate, requiredRole('DRIVER'), accept);

r.post('/:id/pickup', authenticate, requiredRole('DRIVER'), otpLimiter, confirmPickup);
r.post('/:id/dropoff', authenticate, requiredRole('DRIVER'), otpLimiter, confirmDropOff);

r.post('/:id/complete', authenticate, requiredRole('DRIVER'), complete);
r.get('/:id/invoice', authenticate, getInvoiceDetail);
r.post('/:id/cancel', authenticate, requiredRole('SHIPPER'), cancel);
r.post('/:id/commit', authenticate, requiredRole('DRIVER'), commitScheduled);

export default r;
