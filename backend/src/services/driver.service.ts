import prisma from '@/config/database';
import { addDriverLocation, removeDriverLocation } from '@/services/grid-index.service';
import { redis } from '@/config/redis';
export const toggleOnline = async (
    driverId: string, isOnline: boolean,
    lat?: number, lng?: number
) => {
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

/**
 * NEW: Returns all SCHEDULED+ACCEPTED bookings committed to this driver,
 * sorted by scheduledAt ascending (their chronological work schedule for the day).
 */
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

/**
 * NEW: Returns SCHEDULED+PENDING jobs that match the driver's vehicle type and capacity.
 * This powers the driver's "Browse Available Scheduled Jobs" board.
 * Does not include jobs this driver is already committed to.
 */
export const getAvailableScheduledJobs = async (driverId: string) => {
    // First fetch this driver's vehicle info so we can filter by type+capacity
    const driver = await prisma.user.findUnique({
        where: { id: driverId },
        include: { vehicle: true },
    });
    if (!driver?.vehicle) return [];

    return prisma.booking.findMany({
        where: {
            bookingType: 'SCHEDULED',
            status: 'PENDING',
            driverId: null,                                  // unassigned
            vehicleType: driver.vehicle.type,               // must match vehicle class
            weightKg: { lte: driver.vehicle.capacityKg },  // within vehicle capacity
            scheduledAt: { gte: new Date() },              // only future jobs
        },
        orderBy: { scheduledAt: 'asc' },
    });
};
