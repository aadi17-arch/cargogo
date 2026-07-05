import prisma from "@/config/database";
import { calculatePrice } from "@/services/pricing.service";
import { generateOTP } from "@/services/otp.service";
import { VEHICLE_RATES } from "@/services/pricing.service";
import { AppError } from "@/utils/AppError";
import { haversineDistance } from "@/utils/haversine";

export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
    PENDING: ['ACCEPTED', 'CANCELLED'],
    ACCEPTED: ['IN_TRANSIT', 'CANCELLED'],
    IN_TRANSIT: ['DELIVERED'],
    DELIVERED: ['COMPLETED', 'DISPUTED'],
    COMPLETED: [],
    CANCELLED: [],
    DISPUTED: ['COMPLETED']
};

interface createBookingInput {
    shipperId: string,
    pickupLat: number,
    pickupLng: number,
    pickupAddress: string,
    dropoffLat: number,
    dropoffLng: number,
    dropoffAddress: string,
    cargoType: string,
    weightKg: number
    lengthCm: number;
    widthCm: number,
    heightCm: number,
    vehicleType: 'TWO_WHEELER' | 'THREE_WHEELER' | 'MINI_TEMPO' | 'PICKUP_TRUCK' | 'CONTAINER_3TON' | 'HEAVY_DUTY_TRUCK';
    // NEW: Optional scheduled booking fields. When omitted, booking behaves as INSTANT.
    bookingType?: 'INSTANT' | 'SCHEDULED';
    scheduledAt?: Date;
    scheduledUntil?: Date;
}

export async function getBookingOrThrow(bookingId: string) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new AppError('Booking not found', 404);
    return booking;
}

function assertDriverOwnership(booking: { driverId: string | null }, driverId: string) {
    if (booking.driverId !== driverId) {
        throw new AppError('Unauthorized: You are not the assigned driver for this booking.', 403);
    }
}

export const createBooking = async (input: createBookingInput) => {
    // Validate distance is not zero or extremely close
    const distance = haversineDistance(input.pickupLat, input.pickupLng, input.dropoffLat, input.dropoffLng);
    if (distance < 0.1) {
        throw new AppError("Pickup and dropoff locations cannot be the same.", 400);
    }

    const pricing = calculatePrice({
        pickupLat: input.pickupLat,
        pickupLng: input.pickupLng,
        dropoffLat: input.dropoffLat,
        dropoffLng: input.dropoffLng,
        weightKg: input.weightKg,
        lengthCm: input.lengthCm,
        widthCm: input.widthCm,
        heightCm: input.heightCm,
        vehicleType: input.vehicleType,
    });

    const bookingType = input.bookingType ?? 'INSTANT';

    // Validate that scheduled booking is at least 2 hours in the future
    if (bookingType === 'SCHEDULED') {
        if (!input.scheduledAt) throw new AppError('scheduledAt is required for SCHEDULED bookings', 400);
        const minLeadTime = new Date(Date.now() + 2 * 60 * 60 * 1000); 
        if (new Date(input.scheduledAt) < minLeadTime) {
            throw new AppError('scheduledAt must be at least 2 hours in the future', 400);
        }
    }

    const booking = await prisma.booking.create({
        data: {
            shipperId: input.shipperId,
            pickupLat: input.pickupLat,
            pickupLng: input.pickupLng,
            pickupAddress: input.pickupAddress,
            dropoffLat: input.dropoffLat,
            dropoffLng: input.dropoffLng,
            dropoffAddress: input.dropoffAddress,
            cargoType: input.cargoType,
            weightKg: input.weightKg,
            lengthCm: input.lengthCm,
            widthCm: input.widthCm,
            heightCm: input.heightCm,
            volumetricWeight: pricing.volumetricWeight,
            vehicleType: input.vehicleType,
            distanceKm: pricing.distanceKm,
            price: pricing.totalPrice,
            bookingType,
            scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
            scheduledUntil: input.scheduledUntil ? new Date(input.scheduledUntil) : null,
            // Generate OTPs immediately for instant trips, but defer for scheduled ones
            ...(bookingType === 'INSTANT' ? {
                pickupOTP: generateOTP(),
                dropoffOTP: generateOTP(),
            } : {}),
        }
    });
    return { booking, pricing };
}

// Commits a driver to a scheduled booking in a transaction to prevent double assignment
export const commitToScheduledJob = async (bookingId: string, driverId: string) => {
    return prisma.$transaction(async (tx) => {
        const booking = await tx.booking.findUnique({ where: { id: bookingId } });
        if (!booking) throw new AppError('Booking not found', 404);

        // Guard: only PENDING SCHEDULED jobs can be committed to
        if (booking.bookingType !== 'SCHEDULED') {
            throw new AppError('This booking is not a scheduled job', 400);
        }
        if (booking.status !== 'PENDING') {
            throw new AppError('This job has already been taken or is no longer available', 409);
        }
        if (booking.driverId) {
            throw new AppError('This job has already been claimed by another driver', 409);
        }

        return tx.booking.update({
            where: { id: bookingId },
            data: {
                driverId,
                status: 'ACCEPTED',
                committedAt: new Date(),
                // Generate OTPs now that we have an assigned driver
                pickupOTP: generateOTP(),
                dropoffOTP: generateOTP(),
            },
        });
    });
};

export const getBookingById = async (bookingId: string) => {
    return prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
            shipper: { select: { id: true, name: true, email: true } },
            driver:  { select: { id: true, name: true, email: true } },
            review: true
        }
    });
};

export const getShipperBookings = async (shipperId: string) => {
    return prisma.booking.findMany({ where: { shipperId }, orderBy: { createdAt: 'desc' } });
};

export const verifyPickupOTP = async (bookingId: string, otp: string, driverId: string) => {
    const booking = await getBookingOrThrow(bookingId);
    assertDriverOwnership(booking, driverId);
    if (booking.status !== 'ACCEPTED') throw new AppError('Booking has not been accepted by a driver yet.', 400);
    if (booking.otpAttempts >= 3) {
        throw new AppError('Too many failed OTP verification attempts. This booking is locked.', 400);
    }
    if (booking.pickupOTP !== otp) {
        await prisma.booking.update({
            where: { id: bookingId },
            data: { otpAttempts: { increment: 1 } }
        });
        throw new AppError('Wrong OTP', 400);
    }
    return prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'IN_TRANSIT', pickupVerified: true, otpAttempts: 0 }
    });
};

export const verifyDropOffOTP = async (bookingId: string, otp: string, driverId: string) => {
    const booking = await getBookingOrThrow(bookingId);
    assertDriverOwnership(booking, driverId);
    if (booking.status !== 'IN_TRANSIT') throw new AppError('Booking not in transit', 400);
    if (booking.otpAttempts >= 3) {
        throw new AppError('Too many failed OTP verification attempts. This booking is locked.', 400);
    }
    if (booking.dropoffOTP !== otp) {
        await prisma.booking.update({
            where: { id: bookingId },
            data: { otpAttempts: { increment: 1 } }
        });
        throw new AppError('Wrong OTP', 400);
    }
    return prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'DELIVERED', dropoffVerified: true, otpAttempts: 0 }
    });
};

export const getDriverBookings = async (driverId: string) => {
    return prisma.booking.findMany({ where: { driverId }, orderBy: { createdAt: 'desc' } });
};

export const getPendingBookings = async () => {
    return prisma.booking.findMany({ where: { status: 'PENDING' }, orderBy: { createdAt: 'desc' } });
};

export const completeBooking = async (bookingId: string, driverId: string) => {
    const booking = await getBookingOrThrow(bookingId);
    assertDriverOwnership(booking, driverId);
    if (!VALID_STATUS_TRANSITIONS[booking.status]?.includes('COMPLETED')) {
        throw new AppError(`Invalid transition from ${booking.status} to COMPLETED`, 400);
    }
    await prisma.booking.update({ where: { id: bookingId }, data: { status: 'COMPLETED' } });
};

export const getInvoice = async (bookingId: string) => {
    const booking = await getBookingOrThrow(bookingId);
    const rates = VEHICLE_RATES[booking.vehicleType];
    const chargeableWeight = Math.max(booking.weightKg, booking.volumetricWeight);
    const distanceCost = rates.pricePerKm * booking.distanceKm;
    const weightCost = rates.costPerUnit * chargeableWeight;
    return {
        bookingId: booking.id,
        vehicleType: booking.vehicleType,
        basePrice: rates.basePrice,
        distanceKm: booking.distanceKm,
        pricePerKm: rates.pricePerKm,
        distanceCost: Math.round(distanceCost * 100) / 100,
        weightKg: booking.weightKg,
        volumetricWeight: booking.volumetricWeight,
        chargeableWeight: Math.round(chargeableWeight * 100) / 100,
        costPerUnit: rates.costPerUnit,
        weightCost: Math.round(weightCost * 100) / 100,
        totalPrice: booking.price
    };
};

export const cancelBooking = async (bookingId: string, userId: string) => {
    const booking = await getBookingOrThrow(bookingId);
    if (booking.shipperId !== userId) throw new AppError('Unauthorized', 403);
    if (!VALID_STATUS_TRANSITIONS[booking.status]?.includes('CANCELLED')) {
        throw new AppError('Cannot cancel booking once it is in transit or completed', 400);
    }
    return prisma.booking.update({ where: { id: bookingId }, data: { status: 'CANCELLED' } });
};
