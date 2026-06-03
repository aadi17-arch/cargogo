import { redis } from '@/config/redis';

export const addDriverLocation = async (driverId: string, lat: number, lng: number) => {
  await redis.geoAdd('drivers:online', {
    longitude: lng,
    latitude: lat,
    member: `driver:${driverId}`
  });
};

export const findNearbyDrivers = async (
  lat: number,
  lng: number,
  radiusKm: number
) => {
  const results = await redis.geoRadiusWith(
    'drivers:online',
    { longitude: lng, latitude: lat },
    radiusKm,
    'km',
    ['WITHDIST'] as any
  );
  return results.map((r: any) => ({
    driverId: r.member.replace('driver:', ''),
    distanceKm: r.distance ?? 0
  }));
};

export const removeDriverLocation = async (driverId: string) => {
  await redis.zRem('drivers:online', `driver:${driverId}`);
};
