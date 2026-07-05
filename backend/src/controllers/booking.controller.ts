import { Request, Response } from 'express';
import {
    createBooking,
    getBookingById,
    getShipperBookings,
    getDriverBookings,
    verifyDropOffOTP,
    verifyPickupOTP,
    getPendingBookings,
    cancelBooking,
    completeBooking,
    getInvoice,
    commitToScheduledJob,
} from '@/services/booking.service';
import { acceptBooking } from '@/services/matching.service';
import { startGpsSimulation } from '@/services/gps-simulator.service';
import { getUpcomingScheduledJobs, getAvailableScheduledJobs } from '@/services/driver.service';
import { catchAsync } from '@/utils/catchAsync';

// make sure shipper/driver owns the booking before letting them see or edit it

function assertBookingAccess(
    req: Request,
    res: Response,
    booking: { shipperId: string; driverId: string | null; status: string }
): boolean {
    const { id, role } = req.user;
    if (role === 'SHIPPER' && booking.shipperId !== id) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return false;
    }
    if (role === 'DRIVER' && booking.driverId !== id && !(booking.status === 'PENDING')) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return false;
    }
    return true;
}

export const create = catchAsync(async (req: Request, res: Response) => {
    const result = await createBooking({ ...req.body, shipperId: req.user.id });
    res.status(201).json({ success: true, data: result });
});

export const getBookingsById = catchAsync(async (req: Request, res: Response) => {
    const booking = await getBookingById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Not found' });
    if (!assertBookingAccess(req, res, booking)) return;
    res.json({ success: true, data: booking });
});

export const getMyBookings = catchAsync(async (req: Request, res: Response) => {
    if (req.user.role === 'DRIVER') {
        const data = await getDriverBookings(req.user.id);
        return res.json({ success: true, data });
    }
    const data = await getShipperBookings(req.user.id);
    res.json({ success: true, data });
});

export const confirmPickup = catchAsync(async (req: Request, res: Response) => {
    const booking = await getBookingById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Not found' });
    if (!assertBookingAccess(req, res, booking)) return;

    const { otp } = req.body;
    const updated = await verifyPickupOTP(req.params.id, otp, req.user.id);
    const io = req.app.get('io');
    startGpsSimulation(updated.id, updated.pickupLat, updated.pickupLng, updated.dropoffLat, updated.dropoffLng, io);
    res.status(201).json({ success: true, data: updated });
});

export const confirmDropOff = catchAsync(async (req: Request, res: Response) => {
    const booking = await getBookingById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Not found' });
    if (!assertBookingAccess(req, res, booking)) return;

    const { otp } = req.body;
    const updated = await verifyDropOffOTP(req.params.id, otp, req.user.id);
    res.status(201).json({ success: true, data: updated });
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
    const booking = await getBookingById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Not found' });
    if (!assertBookingAccess(req, res, booking)) return;

    await completeBooking(req.params.id, req.user.id);
    res.json({ success: true, message: 'Booking completed successfully' });
});

export const getInvoiceDetail = catchAsync(async (req: Request, res: Response) => {
    const booking = await getBookingById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Not found' });
    // invoice is more private — pending drivers cannot view it
    const { id, role } = req.user;
    if (id !== booking.shipperId && id !== booking.driverId && role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Access denied: You are not authorized to view this invoice.' });
    }
    const invoice = await getInvoice(req.params.id);
    res.json({ success: true, data: invoice });
});

export const cancel = catchAsync(async (req: Request, res: Response) => {
    const booking = await getBookingById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Not found' });
    if (!assertBookingAccess(req, res, booking)) return;

    const updated = await cancelBooking(req.params.id, req.user.id);
    if (updated.driverId) {
        const io = req.app.get('io');
        io.to(`driver:${updated.driverId}`).emit('booking-cancelled', {
            bookingId: updated.id,
            message: 'Shipper has cancelled this booking.',
        });
    }
    res.json({ success: true, data: updated });
});

// driver claims a scheduled delivery
export const commitScheduled = catchAsync(async (req: Request, res: Response) => {
    const booking = await commitToScheduledJob(req.params.id, req.user.id);
    // ping the shipper so their UI updates live
    const io = req.app.get('io');
    io.to(`shipper:${booking.shipperId}`).emit('scheduled-job-committed', {
        bookingId: booking.id,
        driverId: req.user.id,
        driverName: (req.user as any).name,
        committedAt: booking.committedAt,
    });
    res.json({ success: true, data: booking });
});

// Returns driver's committed upcoming scheduled list
export const getScheduledJobs = catchAsync(async (req: Request, res: Response) => {
    const data = await getUpcomingScheduledJobs(req.user.id);
    res.json({ success: true, data });
});

// Returns available scheduled jobs that match driver vehicle specifications
export const getAvailableJobs = catchAsync(async (req: Request, res: Response) => {
    const data = await getAvailableScheduledJobs(req.user.id);
    res.json({ success: true, data });
});
