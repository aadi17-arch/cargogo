import { Request, Response } from 'express';
import { createBooking, getBookingById, getShipperBookings, getDriverBookings, verifyDropOffOTP, verifyPickupOTP } from '@/services/booking.service';

export const create = async (req: Request, res: Response) => {
    try {
        const result = await createBooking({
            ...req.body,
            shipperId: req.user.id,
        });
        res.status(201).json({ success: true, data: result });
    }
    catch (e: any) {
        res.status(400).json({ success: false, message: e.message });
    }
};
export const getBookingsById = async (req: Request, res: Response) => {
    try {
        const booking = await getBookingById(req.params.id);
        if (!booking) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, data: booking });
    }
    catch (e: any) {
        res.status(400).json({ success: false, message: e.message });
    }
};
export const getMyBookings = async (req: Request, res: Response) => {
    try {
        if (req.user.role === 'DRIVER') {
            const driverBookings = await getDriverBookings(req.user.id);
            return res.json({ success: true, data: driverBookings });
        }
        const shipperBookings = await getShipperBookings(req.user.id);
        res.json({ success: true, data: shipperBookings });
    }
    catch (e: any) {
        res.status(400).json({ success: false, message: e.message });
    }
};
export const confirmPickup = async (req: Request, res: Response) => {
    try {
        const { otp } = req.body;
        const checkOTP = await verifyPickupOTP(req.params.id, otp);
        res.status(201).json({ success: true, data: checkOTP });
    }
    catch (e: any) {
        res.status(400).json({ success: false, message: e.message });
    }
};

export const confirmDropOff = async (req: Request, res: Response) => {
    try {
        const { otp } = req.body;
        const checkOTP = await verifyDropOffOTP(req.params.id, otp);
        res.status(201).json({ success: true, data: checkOTP });
    }
    catch (e: any) {
        res.status(400).json({ success: false, message: e.message });
    }
};
