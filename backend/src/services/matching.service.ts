import prisma from '@/config/database'
import { haversineDistance } from '@/utils/haversine';
import { findNearbyDrivers as findNearbyFromRedis } from './grid-index.service';

export const findNearbyDrivers = async (
    pickupLat: number,
    pickupLng: number,
    radiusKm: number = 5
) => {
    const nearby = await findNearbyFromRedis(pickupLat, pickupLng, radiusKm);

    const driverIds = nearby.map((n) => n.driverId);
    const profiles = await prisma.driverProfile.findMany({
        where: { userId: { in: driverIds } },
        include: { user: { include: { vehicle: true } } },
    });
    return nearby.map((n) => {
        const profile = profiles.find((p) => p.userId === n.driverId);
        return { ...profile, distanceKm: n.distanceKm, userId: n.driverId };
    }).filter((d) => d.userId);
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
