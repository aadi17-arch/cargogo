import { SocketIOServer } from './socket.server';
import { findNearbyDrivers, acceptBooking } from '@/services/matching.service';
import prisma from '@/config/database';

const activeTimers = new Map<string, NodeJS.Timeout>();
export const registerMatchingHandlers = (
    io: SocketIOServer
) => {
    io.on('connection', (socket) => {
        const user = socket.data.user;

        if (user.role === 'DRIVER' && user.driverProfile) {
            socket.join(`driver:${user.id}`);
        } else if (user.role === 'SHIPPER') {
            socket.join(`shipper:${user.id}`);
        }
        // booking cargoo
        socket.on('book-cargo', async (bookingData) => {
            try {
                const bookingId = bookingData.bookingId;
                const booking = await prisma.booking.findUnique({
                    where: { id: bookingId },
                });
                if (!booking) throw new Error('Booking not found');
                const nearbyDrivers = await findNearbyDrivers(
                    booking.pickupLat,
                    booking.pickupLng,
                    5
                );
                if (nearbyDrivers.length === 0) {
                    socket.emit('no-drivers', { bookingId, message: 'All drivers declined' });
                    return;
                }

                let driverIdx = 0;
                dispatchToNextDriver();

                function dispatchToNextDriver() {
                    if (driverIdx >= nearbyDrivers.length) {
                        socket.emit('no-drivers', { bookingId, message: 'All drivers declined' });
                         return;
                    }

                    const driver = nearbyDrivers[driverIdx];
                const driverSocketId = `driver:${driver.userId}`;
                    io.to(driverSocketId).emit('incoming-bid', {
                        bookingId,
                        pickupLat: booking!.pickupLat,
                        pickupLng: booking!.pickupLng,
                        dropoffLat: booking!.dropoffLat,
                        dropoffLng: booking!.dropoffLng,
                        cargoType: booking!.cargoType,
                        price: booking!.price,
                        distanceKm: driver.distanceKm,
                        timeoutSeconds: 30,
                        expiresAt: Date.now() + 30000
                    });
                // after one timeout we will move to next driver-
                const timer = setTimeout(() => {
                    driverIdx++;
                    dispatchToNextDriver();
                }, 30000);
                    activeTimers.set(bookingId, timer);
                }

            }
            catch (e: any) {
                socket.emit('error', { message: e.message });
            }
        });
        // driver takes the ride
        socket.on('accept-bid', async ({ bookingId }) => {
            try {
                // remove the  timer means if accepted clear the timer so it doesnt get to next driver
                const timer = activeTimers.get(bookingId);
                if (timer) {
                    clearTimeout(timer);
                    activeTimers.delete(bookingId);
                }
                const booking = await acceptBooking(bookingId, user.id);
                io.to(`shipper:${booking.shipperId}`).emit('booking-accepted', {
                    bookingId,
                    driverId: user.id,
                    driverName: user.name,
                });
                socket.emit('bid-accepted', { bookingId });
            } catch(e:any) {
                socket.emit('error', { message: e.message });
           }
        });
        //rejecting bid
        socket.on('reject-bid', ({ bookingId }) => {
            const timer = activeTimers.get(bookingId);
            if (timer) {
                clearTimeout(timer);
                activeTimers.delete(bookingId);
            }
            socket.emit('bid-rejected', {
                bookingId,
                message: 'You rejected. Waiting for the next driver.'
            });
        });
    })
}
