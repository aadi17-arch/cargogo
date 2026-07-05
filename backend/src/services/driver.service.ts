import prisma from '@/config/database';
import { addDriverLocation, removeDriverLocation } from '@/services/grid-index.service';
import { redis } from '@/config/redis';
import { AppError } from '@/utils/AppError';
export const toggleOnline = async (
    driverId: string, isOnline: boolean,
    lat?: number, lng?: number
) => {
    if (!isOnline) {
        const activeTrip = await prisma.booking.findFirst({
            where: {
                driverId: driverId,
                status: 'IN_TRANSIT'
            }
        });
        if (activeTrip) {
            throw new AppError('Cannot go offline while on an active trip.', 400);
        }
    }

    if (isOnline && lat !== undefined && lng !== undefined) {
        const driver = await prisma.user.findUnique({
            where: { id: driverId },
            select: {
                name: true,
                phone: true,
                vehicle: {
                    select: {
                        type: true,
                        plateNumber: true
                    }
                }
            }
        });
        if (driver) {
            await redis.hSet(`driver:meta:${driverId}`, {
                name: driver.name,
                phone: driver.phone || '',
                vehicleType: driver.vehicle?.type || '',
                plateNumber: driver.vehicle?.plateNumber || ''
            });
            await redis.expire(`driver:meta:${driverId}`, 86400);
            await addDriverLocation(driverId, lat, lng);
        }
    }
    else {
        await removeDriverLocation(driverId);
        await redis.del(`driver:meta:${driverId}`);
     }
    return prisma.driverProfile.update({
        where: { userId: driverId },
        data: {
            isOnline,
            ...(isOnline && lat != undefined && lng != undefined ? {
                latitude: lat,
                longitude: lng
            } : {}),
        },
    });
};
export const updateLocation = async (
    driverId: string,
    lat: number,
    lng: number
) => {
    const profile = await prisma.driverProfile.findUnique({
        where: { userId: driverId }
    });
    if (!profile || !profile.isOnline) {
        throw new AppError('Cannot update location while offline.', 400);
    }
    await addDriverLocation(driverId, lat, lng);
    return prisma.driverProfile.update({
        where: { userId: driverId },
        data: {
            latitude: lat,
            longitude: lng
        }
    });
};
export const getOnlineDrivers = async () => {
    return prisma.driverProfile.findMany({
        where: { isOnline: true },
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
};

// Returns all committed upcoming scheduled bookings for a driver
export const getUpcomingScheduledJobs = async (driverId: string) => {
    return prisma.booking.findMany({
        where: {
            driverId,
            bookingType: 'SCHEDULED',
            status: { in: ['ACCEPTED', 'IN_TRANSIT'] },
        },
        orderBy: { scheduledAt: 'asc' },
    });
};

// Returns available scheduled jobs matching driver's vehicle specifications
export const getAvailableScheduledJobs = async (driverId: string) => {
    const driver = await prisma.user.findUnique({
        where: { id: driverId },
        include: { vehicle: true },
    });
    if (!driver?.vehicle) return [];

    return prisma.booking.findMany({
        where: {
            bookingType: 'SCHEDULED',
            status: 'PENDING',
            driverId: null,
            vehicleType: driver.vehicle.type,
            weightKg: { lte: driver.vehicle.capacityKg },
            scheduledAt: { gte: new Date() },
        },
        orderBy: { scheduledAt: 'asc' },
    });
};
