import prisma from '@/config/database';

export const toggleOnline = async (
    driverId: string, isOnline: boolean,
    lat?: number, lng?: number
) => {
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
            user: { include: { vehicle: true } }
        }
    });
};

