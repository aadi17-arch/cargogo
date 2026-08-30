import { redis } from '@/config/redis';

export const addDriverLocation = async (driverId: string, lat: number, lng: number) => {
  await redis.geoadd('drivers:online', lng, lat, `driver:${driverId}`);
  await redis.set(`driver:presence:${driverId}`, 'ONLINE', 'EX', 45);
};

export const findNearbyDrivers = async (
  lat: number,
  lng: number,
  radiusKm: number
) => {
  const results: any = await redis.georadius(
    'drivers:online',
    lng,
    lat,
    radiusKm,
    'km',
    'WITHDIST'
  );
  const activeDrivers = [];
  for (const r of results) {
    const driverId = (Array.isArray(r) ? r[0] : r).replace('driver:', '');
    const distanceKm = (Array.isArray(r) && r[1] ? parseFloat(r[1]) : 0);
    const isDriverAlive = await redis.get(`driver:presence:${driverId}`);
    isDriverAlive ? activeDrivers.push({ driverId, distanceKm }) : await redis.zrem('drivers:online', 'driver:' + driverId);
  }

  return activeDrivers;
};

export const removeDriverLocation = async (driverId: string) => {
  await redis.zrem('drivers:online', `driver:${driverId}`);
  await redis.del(`driver:presence:${driverId}`);
};
