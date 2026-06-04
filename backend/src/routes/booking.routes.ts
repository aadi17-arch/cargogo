import { Router } from 'express';
import { create, getBookingsById, getMyBookings, confirmPickup, confirmDropOff, getPending, accept } from '../controllers/booking.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { requiredRole } from '@/middleware/role.middleware';
import { complete,getInvoiceDetail } from '../controllers/booking.controller';
const r = Router();

r.post('/createBooking', authenticate, requiredRole('SHIPPER'), create);
r.get('/my', authenticate, getMyBookings);
r.get('/pending', authenticate, requiredRole('DRIVER'), getPending);

r.get('/:id', authenticate, getBookingsById);
r.post('/:id/accept', authenticate, requiredRole('DRIVER'), accept);

r.post('/:id/pickup', authenticate, requiredRole('DRIVER'), confirmPickup);
r.post('/:id/dropoff', authenticate, requiredRole('DRIVER'), confirmDropOff);

r.post('/:id/complete', authenticate, requiredRole('DRIVER'), complete);
r.get('/:id/invoice',authenticate,getInvoiceDetail);

export default r;
