import { SocketIOServer } from '@/sockets/socket.server';
import { findNearbyDrivers, acceptBooking } from '@/services/matching.service';
import prisma from '@/config/database';
import { addDispatchJob, dispatchQueue } from '@/queues/dispatch.queue';

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
                await addDispatchJob(bookingId, booking.pickupLat, booking.pickupLng, 0, 0);

                socket.emit('dispatch-queued', { bookingId });

            }
            catch (e: any) {
                socket.emit('error', { message: e.message });
            }
        });
        // driver takes the ride
        socket.on('accept-bid', async ({ bookingId }) => {
            try {
                const booking = await acceptBooking(bookingId, user.id);

                const jobs = await dispatchQueue.getJobs(['delayed', 'waiting']);

                for (const j of jobs) {
                    if (j.data.bookingId === bookingId) await j.remove();
                }
                io.to(`shipper:${booking.shipperId}`).emit('booking-accepted', {
                    bookingId,
                    driverId: user.id,
                    driverName: user.name,
                });
                socket.emit('bid-accepted', { bookingId });
            } catch (e: any) {
                socket.emit('error', { message: e.message });
            }
        });
        //rejecting bid
        socket.on('reject-bid', async ({ bookingId }) => {
            try {
                const jobs = await dispatchQueue.getJobs(['delayed', 'waiting']);
                let nextDriverIndex = 0;
                let pickupLat = 0;
                let pickupLng = 0;

                for (const j of jobs) {
                    if (j.data.bookingId === bookingId) {
                        nextDriverIndex = j.data.driverIndex + 1;
                        pickupLat = j.data.pickupLat;
                        pickupLng = j.data.pickupLng;
                        await j.remove();
                    }
                }

                if (pickupLat && pickupLng) {
                    await addDispatchJob(bookingId, pickupLat, pickupLng, nextDriverIndex, 0);
                }

                socket.emit('bid-rejected', {
                    bookingId,
                    message: 'Rejected. Moving to the next driver.'
                });
            } catch (e: any) {
                socket.emit('error', { message: e.message });
            }
        });
    });
};
