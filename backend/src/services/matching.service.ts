import prisma from '@/config/database'
import { redis } from '@/config/redis';
import { findNearbyDrivers as findNearbyFromRedis } from '@/services/grid-index.service';

export const findNearbyDrivers = async (
    pickupLat: number,
    pickupLng: number,
    radiusKm: number = 5
) => {
    const nearby = await findNearbyFromRedis(pickupLat, pickupLng, radiusKm);

    const results: any[] = [];
    // i am finding the drivers in redis cache at the moment and mapping them to result array

    for (const n of nearby) {
        const meta = await redis.hGetAll(`driver:meta:${n.driverId}`);

        // if redis has any like if there are nearby..
        if (meta && Object.keys(meta).length > 0) {
            results.push({
                userId: n.driverId,
                isOnline: true,
                distanceKm: n.distanceKm,
                user: {
                    name: meta.name,
                    phone: meta.phone,
                    vehicle: {
                        type: meta.vehicleType,
                        plateNumber: meta.plateNumber,
                    }
                }
            });
            // if not means cache miss : nomally fetch from database takes time
        } else {
            const profile = await prisma.driverProfile.findUnique({
                where: { userId: n.driverId },
                include: { user: { include: { vehicle: true } } }
            });
            if (profile) {
                results.push({
                    ...profile,
                    distanceKm: n.distanceKm,
                    userId: n.driverId
                });
                // if missed fetch from db then again fill those in redis for no cache miss

                await redis.hSet(`driver:meta:${n.driverId}`, {
                    name: profile.user.name,
                    phone: profile.user.phone || '',
                    vehicleType: profile.user.vehicle?.type || '',
                    plateNumber: profile.user.vehicle?.plateNumber || ''
                });
                await redis.expire(`driver:meta:${n.driverId}`, 86400);
            }
        }
    }
    return results;
};
export const acceptBooking = async (
    bookingId: string,
    driverId: string
) => {
    return prisma.$transaction(async (tx) => {
        const booking = await tx.booking.findUnique({
            where: { id: bookingId },
        });
        if (!booking) throw new Error('Booking not found');
        if (booking.status !== 'PENDING') throw new Error('Booking already taken');
        if (booking.driverId) throw new Error('Booking already assigned');

        const updated = await tx.booking.update({
            where: { id: bookingId },
            data: {
                status: 'ACCEPTED',
                driverId: driverId
            }
        });
        return updated;
    });
};

/**
 * NEW: Find candidate drivers for a SCHEDULED booking.
 *
 * Key difference from findNearbyDrivers (instant):
 * - Instant uses Redis geo-index → only currently ONLINE drivers.
 * - Scheduled uses Prisma DB query → ALL drivers with matching vehicle type,
 *   regardless of current online status (they may be offline today for a job tomorrow).
 * - We also filter out drivers who already have a conflicting committed job
 *   overlapping the requested scheduledAt window.
 */
export const findScheduledCandidates = async (booking: {
    vehicleType: string;
    weightKg: number;
    pickupLat: number;
    pickupLng: number;
    scheduledAt: Date;
    scheduledUntil?: Date | null;
}) => {
    // The conflict window: if scheduledUntil is not set, assume a 3-hour job window
    const windowEnd = booking.scheduledUntil ?? new Date(booking.scheduledAt.getTime() + 3 * 60 * 60 * 1000);

    // Find all drivers with matching vehicle type and sufficient capacity
    const candidates = await prisma.user.findMany({
        where: {
            role: 'DRIVER',
            vehicle: {
                type: booking.vehicleType as any,
                capacityKg: { gte: Math.ceil(booking.weightKg) },
            },
            // Exclude drivers already committed to a job in the same time window
            driverBookings: {
                none: {
                    bookingType: 'SCHEDULED',
                    status: { in: ['ACCEPTED', 'IN_TRANSIT'] },
                    committedAt: { not: null },
                    scheduledAt: {
                        // Existing committed job overlaps our window: starts before our window ends
                        lte: windowEnd,
                    },
                    scheduledUntil: {
                        // And ends after our window starts (or has no end time — treated as 3h)
                        gte: booking.scheduledAt,
                    },
                },
            },
        },
        include: {
            vehicle: true,
            driverProfile: true,
        },
    });

    // Rank by haversine distance to pickup location (nearest first)
    // We reuse the same util already imported in vrp.service.ts
    const { haversineDistance } = await import('@/utils/haversine');
    return candidates
        .map((driver) => ({
            ...driver,
            distanceKm: driver.driverProfile
                ? haversineDistance(
                    booking.pickupLat, booking.pickupLng,
                    driver.driverProfile.latitude ?? booking.pickupLat,
                    driver.driverProfile.longitude ?? booking.pickupLng
                )
                : 9999,
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm);
};

/**
 * NEW: Thin wrapper that delegates to commitToScheduledJob in booking.service.
 * Kept here to maintain the single-entry-point pattern for matching operations.
 */
export const commitScheduledJob = async (bookingId: string, driverId: string) => {
    // Import locally to avoid circular dependency (booking.service imports from matching.service)
    const { commitToScheduledJob } = await import('@/services/booking.service');
    return commitToScheduledJob(bookingId, driverId);
};
