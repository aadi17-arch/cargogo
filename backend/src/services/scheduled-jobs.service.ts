import prisma from '@/config/database';
import { findScheduledCandidates } from '@/services/matching.service';
import { SocketIOServer } from '@/sockets/socket.server';

// Match scheduled jobs that start in the next 24 hours
const MATCHING_WINDOW_HOURS = 24;

// Scans the database for upcoming scheduled jobs and alerts suitable drivers
export const processScheduledPool = async (io: SocketIOServer): Promise<void> => {
    const now = new Date();

    // Auto-cancel expired scheduled bookings that were never claimed
    await prisma.booking.updateMany({
        where: {
            bookingType: 'SCHEDULED',
            status: 'PENDING',
            scheduledAt: {
                lt: now
            }
        },
        data: {
            status: 'CANCELLED'
        }
    });

    const windowEnd = new Date(now.getTime() + MATCHING_WINDOW_HOURS * 60 * 60 * 1000);

    // Fetch unassigned scheduled bookings within the window
    const readyBookings = await prisma.booking.findMany({
        where: {
            bookingType: 'SCHEDULED',
            status: 'PENDING',
            driverId: null,
            scheduledAt: {
                gte: now,
                lte: windowEnd,
            },
        },
        orderBy: { scheduledAt: 'asc' },
    });

    if (readyBookings.length === 0) {
        console.log('[ScheduledJobs] No bookings in matching window.');
        return;
    }

    console.log(`[ScheduledJobs] Processing ${readyBookings.length} booking(s) in window.`);

    for (const booking of readyBookings) {
        try {
            const candidates = await findScheduledCandidates({
                vehicleType: booking.vehicleType,
                weightKg: booking.weightKg,
                pickupLat: booking.pickupLat,
                pickupLng: booking.pickupLng,
                scheduledAt: booking.scheduledAt!,
                scheduledUntil: booking.scheduledUntil,
            });

            if (candidates.length === 0) {
                console.log(`[ScheduledJobs] No candidates for booking ${booking.id}`);
                continue;
            }

            await notifyCandidateDrivers(booking, candidates, io);
            console.log(`[ScheduledJobs] Notified ${candidates.length} driver(s) for booking ${booking.id}`);
        } catch (err) {
            // Log and continue — don't let one failing booking block the rest
            console.error(`[ScheduledJobs] Error processing booking ${booking.id}:`, err);
        }
    }
};

// Notifies suitable drivers through socket channels
const notifyCandidateDrivers = async (
    booking: any,
    candidates: any[],
    io: SocketIOServer
): Promise<void> => {
    const payload = {
        bookingId: booking.id,
        cargoType: booking.cargoType,
        vehicleType: booking.vehicleType,
        weightKg: booking.weightKg,
        scheduledAt: booking.scheduledAt,
        scheduledUntil: booking.scheduledUntil,
        pickupAddress: booking.pickupAddress,
        dropoffAddress: booking.dropoffAddress,
        distanceKm: booking.distanceKm,
        price: booking.price,
    };

    for (const candidate of candidates) {
        io.to(`driver:${candidate.id}`).emit('scheduled_job_available', {
            ...payload,
            distanceToPickupKm: candidate.distanceKm, // personalized per driver
        });
    }
};
