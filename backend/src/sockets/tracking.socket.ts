import { Server as SocketIOServer } from 'socket.io';
import prisma from '@/config/database';

export const registerTrackingHandlers = (io: SocketIOServer) => {
  io.on('connection', (socket) => {
    const user = socket.data.user;
    socket.on('driver:location', async ({ lat, lng }) => {
      if (user.role !== 'DRIVER') return;
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
  });
};
