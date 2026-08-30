import { Server as SocketIOServer } from 'socket.io';
import prisma from '@/config/database';
import { addDriverLocation } from '@/services/grid-index.service';
import { startGpsSimulation, stopGpsSimulation } from '@/services/gps-simulator.service';
import { SOCKET_ROOMS, SOCKET_EVENTS } from '@/config/socket-events';

export const registerTrackingHandlers = (io: SocketIOServer) => {
  io.on('connection', (socket) => {
    const user = socket.data.user;
    if (!user) return;

    socket.on(SOCKET_EVENTS.DRIVER_LOCATION, async ({ lat, lng }) => {
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
        const payload = {
          bookingId: booking.id,
          lat,
          lng,
          timeStamp: new Date().toISOString(),
        };
        io.to(SOCKET_ROOMS.shipper(booking.shipperId)).emit(SOCKET_EVENTS.DRIVER_LOCATION_UPDATE, payload);
        io.to(SOCKET_ROOMS.driver(user.id)).emit(SOCKET_EVENTS.DRIVER_LOCATION_UPDATE, payload);
        io.to(SOCKET_ROOMS.booking(booking.id)).emit(SOCKET_EVENTS.DRIVER_LOCATION_UPDATE, payload);
      }
    });

    socket.on(SOCKET_EVENTS.START_TRIP, async ({ bookingId }) => {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId }
      });
      if (!booking || booking.status !== 'IN_TRANSIT') {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Trip not in transit' });
        return;
      }
      if (user.role !== 'DRIVER' || booking.driverId !== user.id) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Unauthorized: only assigned driver can start trip tracking' });
        return;
      }

      
      startGpsSimulation(bookingId, booking.pickupLat, booking.pickupLng, booking.dropoffLat, booking.dropoffLng, io);
    });

    socket.on(SOCKET_EVENTS.STOP_TRIP_TRACKING, ({ bookingId }) => {
      stopGpsSimulation(bookingId);
    });

    socket.on(SOCKET_EVENTS.JOIN_BOOKING_TRACKING, async ({ bookingId }) => {
      const userId = user.id;
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId }
      });
      if (!booking) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Booking not found' });
        return;
      }
      if (userId !== booking.shipperId && userId !== booking.driverId) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Unauthorized' });
        return;
      }
      socket.join(SOCKET_ROOMS.booking(bookingId));
    });
  });
};
