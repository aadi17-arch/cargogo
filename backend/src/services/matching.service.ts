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

    for (const n of nearby) {
        const meta = await redis.hgetall(`driver:meta:${n.driverId}`);

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

                await redis.hset(`driver:meta:${n.driverId}`, {
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


export const findScheduledCandidates = async (booking: {
    vehicleType: string;
    weightKg: number;
    pickupLat: number;
    pickupLng: number;
    scheduledAt: Date;
    scheduledUntil?: Date | null;
}) => {
    
    const windowEnd = booking.scheduledUntil ?? new Date(booking.scheduledAt.getTime() + 3 * 60 * 60 * 1000);

    
    const candidates = await prisma.user.findMany({
        where: {
            role: 'DRIVER',
            vehicle: {
                type: booking.vehicleType as any,
                capacityKg: { gte: Math.ceil(booking.weightKg) },
            },
            driverBookings: {
                none: {
                    OR: [
                        {
                            
                            bookingType: 'SCHEDULED',
                            status: { in: ['ACCEPTED', 'IN_TRANSIT'] },
                            committedAt: { not: null },
                            scheduledAt: {
                                lte: windowEnd,
                            },
                            scheduledUntil: {
                                gte: booking.scheduledAt,
                            },
                        },
                        {
                            
                            bookingType: 'INSTANT',
                            status: { in: ['ACCEPTED', 'IN_TRANSIT'] },
                        }
                    ]
                },
            },
        },
        include: {
            vehicle: true,
            driverProfile: true,
        },
    });

    
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
