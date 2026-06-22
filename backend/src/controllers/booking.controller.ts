import { Request, Response } from 'express';
import { createBooking, getBookingById, getShipperBookings, getDriverBookings, verifyDropOffOTP, verifyPickupOTP, getPendingBookings ,cancelBooking} from '@/services/booking.service';
import { acceptBooking } from '@/services/matching.service';
import { startGpsSimulation } from '@/services/gps-simulator.service';
import { completeBooking,getInvoice } from '@/services/booking.service';
import { catchAsync } from '@/utils/catchAsync';

export const create = catchAsync(async (req: Request, res: Response) => {
    const result = await createBooking({
        ...req.body,
        shipperId: req.user.id,
    });
    res.status(201).json({ success: true, data: result });
});

export const getBookingsById = catchAsync(async (req: Request, res: Response) => {
    const booking = await getBookingById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Not found' });
    
    const isShipperOwner = req.user.id === booking.shipperId;
    const isDriverAssigned = req.user.id === booking.driverId;
    const isPendingForDriver = req.user.role === 'DRIVER' && booking.status === 'PENDING';
    const isAdmin = req.user.role === 'ADMIN';

    if (!isShipperOwner && !isDriverAssigned && !isPendingForDriver && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Access denied: You are not authorized to view this booking.' });
    }

    res.json({ success: true, data: booking });
});

export const getMyBookings = catchAsync(async (req: Request, res: Response) => {
    if (req.user.role === 'DRIVER') {
        const driverBookings = await getDriverBookings(req.user.id);
        return res.json({ success: true, data: driverBookings });
    }
    const shipperBookings = await getShipperBookings(req.user.id);
    res.json({ success: true, data: shipperBookings });
});

export const confirmPickup = catchAsync(async (req: Request, res: Response) => {
    const { otp } = req.body;
    const checkOTP = await verifyPickupOTP(req.params.id, otp);
    const io = req.app.get('io');
    startGpsSimulation(
        checkOTP.id,
        checkOTP.pickupLat,
        checkOTP.pickupLng,
        checkOTP.dropoffLat,
        checkOTP.dropoffLng,
        io
    );
    res.status(201).json({ success: true, data: checkOTP });
});

export const confirmDropOff = catchAsync(async (req: Request, res: Response) => {
    const { otp } = req.body;
    const checkOTP = await verifyDropOffOTP(req.params.id, otp);
    res.status(201).json({ success: true, data: checkOTP });
});

export const getPending = catchAsync(async (req: Request, res: Response) => {
    const bookings = await getPendingBookings();
    res.json({ success: true, data: bookings });
});

export const accept = catchAsync(async (req: Request, res: Response) => {
    const booking = await acceptBooking(req.params.id, req.user.id);
    res.json({ success: true, data: booking });
});

export const complete = catchAsync(async (req: Request, res: Response) => {
    await completeBooking(req.params.id, req.user.id);
    res.json({ success: true, message: 'Booking completed successfully' });
});

export const getInvoiceDetail = catchAsync(async (req: Request, res: Response) => {
    const booking = await getBookingById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Not found' });

    const isShipperOwner = req.user.id === booking.shipperId;
    const isDriverAssigned = req.user.id === booking.driverId;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isShipperOwner && !isDriverAssigned && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Access denied: You are not authorized to view this invoice.' });
    }

    const invoice = await getInvoice(req.params.id);
    res.json({ success: true, data: invoice });
});

export const cancel = catchAsync(async (req: Request, res: Response) => {
    const booking = await cancelBooking(req.params.id, req.user.id);
    if (booking.driverId) {
        const io = req.app.get('io');
        io.to(`driver:${booking.driverId}`).emit('booking-cancelled', {
            bookingId: booking.id,
            message: 'Shipper has cancelled this booking.'
        });
    }

    res.json({ success: true, data: booking });
});
