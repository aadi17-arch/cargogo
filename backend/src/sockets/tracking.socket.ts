import { Server as SocketIOServer } from 'socket.io';
import prisma from '@/config/database';
import { addDriverLocation } from '@/services/grid-index.service';

export const registerTrackingHandlers = (io: SocketIOServer) => {
  io.on('connection', (socket) => {
    const user = socket.data.user;
    socket.on('driver:location', async ({ lat, lng }) => {
      if (user.role !== 'DRIVER') return;
      await addDriverLocation(user.id, lat, lng);
      await prisma.driverProfile.update({
        where: { userId: user.id },
        data: {
          latitude: lat,
          longitude: lng
        }
      });
      const booking = await prisma.booking.findFirst({
        where: {
          driverId: user.id,
          status: 'IN_TRANSIT',
        }
      });
      if (booking) {
        io.to(`shipper:${booking.shipperId}`).emit('driver:location:update', {
          bookingId: booking.id,
          lat,
          lng,
          timeStamp: new Date().toISOString(),
        });
      }
    });
    socket.on('start:trip', async ({ bookingId }) => {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId }
      });
      if (!booking || booking.status !== 'IN_TRANSIT') {
        socket.emit('error', { message: 'Trip not in transit' });
        return;
      }
      const steps = 20;
      const latStep = (booking.dropoffLat - booking.pickupLat) / steps;
      const lngStep = (booking.dropoffLng - booking.pickupLng) / steps;

      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        const lat = booking.pickupLat + latStep * currentStep;
        const lng = booking.pickupLng + lngStep * currentStep;

        io.to(`shipper:${booking.shipperId}`).emit('driver:location:update', {
          bookingId,
          lat,
          lng,
          progress: (currentStep / steps) * 100
        });
        if (currentStep >= steps) {
          clearInterval(interval);
          io.to(`shipper:${booking.shipperId}`).emit('trip:completed', { bookingId })
        }
      }, 3000);
    });
    socket.on('join-booking-tracking', async ({ bookingId }) => {
      const userId = user.id;
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId }
      });
      if (!booking) {
        socket.emit('error', { message: 'Booking not found' });
        return;
      }
      if (userId !== booking.shipperId && userId !== booking.driverId) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }
      socket.join(`booking:${bookingId}`);
    });
  });
};
