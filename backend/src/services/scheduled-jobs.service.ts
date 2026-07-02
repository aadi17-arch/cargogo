import prisma from '@/config/database';
import { findScheduledCandidates } from '@/services/matching.service';
import { SocketIOServer } from '@/sockets/socket.server';

/**
 * NEW SERVICE: scheduled-jobs.service.ts
 *
 * Manages the "scheduled pool" — the set of SCHEDULED+PENDING bookings
 * that are approaching their pickup window and need driver matching.
 *
 * Called periodically (via a BullMQ repeatable job or cron) and also
 * manually via the /driver/trigger-scheduled-match endpoint.
 *
 * Architecture decision: We intentionally do NOT auto-assign drivers here.
 * Instead we notify candidates and let drivers self-select via the Browse Jobs board.
 * This respects driver autonomy and gives shippers a committed driver, not a coerced one.
 */

// How far in advance to start notifying drivers (24 hours)
const MATCHING_WINDOW_HOURS = 24;

/**
 * Core engine: finds SCHEDULED+PENDING bookings within the matching window
 * and emits socket notifications to candidate drivers.
 */
export const processScheduledPool = async (io: SocketIOServer): Promise<void> => {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + MATCHING_WINDOW_HOURS * 60 * 60 * 1000);

    // Find SCHEDULED bookings that:
    // 1. Are still unassigned (PENDING, no driverId)
    // 2. Have a pickup time within the next 24 hours
    const readyBookings = await prisma.booking.findMany({
        where: {
            bookingType: 'SCHEDULED',
            status: 'PENDING',
            driverId: null,
            scheduledAt: {
                gte: now,        // not already past
                lte: windowEnd,  // within notification window
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

/**
 * Emits 'scheduled_job_available' to each candidate driver's socket room.
 * Uses the same room naming convention as the instant flow: driver:<id>
 */
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
