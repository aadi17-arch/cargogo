import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import prisma from '@/config/database';
import { findNearbyDrivers } from '@/services/grid-index.service';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const dispatchQueue = new Queue('dispatch', { connection: connection as any });

export const addDispatchJob = async (
  bookingId: string,
  pickupLat: number,
  pickupLng: number,
  driverIndex: number = 0,
  delay: number = 30000
) => {
  await dispatchQueue.add(
    'timeout',
    { bookingId, pickupLat, pickupLng, driverIndex },
    {
      delay,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay:5000
      },
      jobId: `dispatch:${bookingId}:${driverIndex}`,
    }
  );
};
export const startDispatchWorker = (io: any) => {
  const worker = new Worker(
    'dispatch',
    async (job) => {
      const { bookingId, pickupLat, pickupLng, driverIndex } = job.data;

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId }
      });

      if (!booking || booking.status !== 'PENDING') {
        console.log(`Booking ${bookingId} no longer pending, skipping`);
        return;

      }
      const searchRadius = process.env.NODE_ENV === 'production' ? 5 : 100;
      const nearby = await findNearbyDrivers(pickupLat, pickupLng, searchRadius);

      const filteredNearby: typeof nearby = [];
      for (const n of nearby) {
        const profile = await prisma.driverProfile.findUnique({
          where: { userId: n.driverId },
          include: { user: { include: { vehicle: true } } }
        });
        if (profile?.user?.vehicle) {
          const vehicle = profile.user.vehicle;
          if (vehicle.type === booking.vehicleType && vehicle.capacityKg >= booking.weightKg) {
            filteredNearby.push(n);
          }
        }
      }

      if (driverIndex >= filteredNearby.length) {
        io.to(`shipper:${booking.shipperId}`).emit('no-drivers', {
          bookingId,
          message: 'All drivers declined',
        });
        return;
      }

      const driver = filteredNearby[driverIndex];

      io.to(`driver:${driver.driverId}`).emit('incoming-bid', {
        bookingId,
        pickupLat: booking.pickupLat,
        pickupLng: booking.pickupLng,
        dropoffLat: booking.dropoffLat,
        dropoffLng: booking.dropoffLng,
        cargoType: booking.cargoType,
        price: booking.price,
        distanceKm: driver.distanceKm,
        expiresAt: Date.now() + 30000,
      });

      await addDispatchJob(bookingId, pickupLat, pickupLng, driverIndex + 1);
    },
    {
      connection: connection as any,
     }
  );
  console.log('dispatcher worker started');
  return worker;
};
