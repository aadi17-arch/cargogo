import prisma from '@/config/database'
import { haversineDistance } from '@/utils/haversine';

export const findNearbyDrivers = async (
    pickupLat: number,
    pickupLng: number,
    radiusKm: number = 5
) => {
    const onlineDrivers = await prisma.driverProfile.findMany({
        where: {
            isOnline: true,
            latitude: { not: null },
            longitude: { not: null }

        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                    phone: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true,
                    vehicle: true
                }
            }
        }
    });
    const nearby = onlineDrivers.map((driver) => ({
        ...driver,
        distanceKm: haversineDistance(
            pickupLat,
            pickupLng,
            driver.latitude!,
            driver.longitude!
        ),
    }))
        .filter((driver) => driver.distanceKm <= radiusKm)
        .sort((a, b) => a.distanceKm - b.distanceKm);
    return nearby;
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