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

/** Asserts the current user can access a booking (owner / assigned driver / admin).
 *  Returns 403 response if denied — returns `true` if access is allowed. */
function assertBookingAccess(
    req: Request,
    res: Response,
    booking: { shipperId: string; driverId: string | null; status: string }
): boolean {
    const { id, role } = req.user;
    const isShipperOwner    = id === booking.shipperId;
    const isDriverAssigned  = id === booking.driverId;
    const isPendingForDriver = role === 'DRIVER' && booking.status === 'PENDING';
    const isAdmin            = role === 'ADMIN';
    if (!isShipperOwner && !isDriverAssigned && !isPendingForDriver && !isAdmin) {
        res.status(403).json({ success: false, message: 'Access denied: You are not authorized to view this booking.' });
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
    const { otp } = req.body;
    const updated = await verifyPickupOTP(req.params.id, otp, req.user.id);
    const io = req.app.get('io');
    startGpsSimulation(updated.id, updated.pickupLat, updated.pickupLng, updated.dropoffLat, updated.dropoffLng, io);
    res.status(201).json({ success: true, data: updated });
});

export const confirmDropOff = catchAsync(async (req: Request, res: Response) => {
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
    await completeBooking(req.params.id, req.user.id);
    res.json({ success: true, message: 'Booking completed successfully' });
});

export const getInvoiceDetail = catchAsync(async (req: Request, res: Response) => {
    const booking = await getBookingById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Not found' });
    // Invoice uses a narrower access check (no pending-driver exception)
    const { id, role } = req.user;
    if (id !== booking.shipperId && id !== booking.driverId && role !== 'ADMIN') {
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
            message: 'Shipper has cancelled this booking.',
        });
    }
    res.json({ success: true, data: booking });
});

/**
 * NEW: Driver commits to a SCHEDULED booking.
 * Uses a Prisma transaction under the hood to prevent race conditions
 * (two drivers trying to commit to the same job simultaneously).
 */
export const commitScheduled = catchAsync(async (req: Request, res: Response) => {
    const booking = await commitToScheduledJob(req.params.id, req.user.id);
    // Notify the shipper that their scheduled job now has a committed driver
    const io = req.app.get('io');
    io.to(`shipper:${booking.shipperId}`).emit('scheduled-job-committed', {
        bookingId: booking.id,
        driverId: req.user.id,
        driverName: (req.user as any).name,
        committedAt: booking.committedAt,
    });
    res.json({ success: true, data: booking });
});

/** NEW: Returns all SCHEDULED+ACCEPTED bookings for the current driver (their upcoming schedule). */
export const getScheduledJobs = catchAsync(async (req: Request, res: Response) => {
    const data = await getUpcomingScheduledJobs(req.user.id);
    res.json({ success: true, data });
});

/** NEW: Returns SCHEDULED+PENDING jobs matching the driver's vehicle type (browse board). */
export const getAvailableJobs = catchAsync(async (req: Request, res: Response) => {
    const data = await getAvailableScheduledJobs(req.user.id);
    res.json({ success: true, data });
});
