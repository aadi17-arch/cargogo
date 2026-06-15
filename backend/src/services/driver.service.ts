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
