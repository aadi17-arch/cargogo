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
        // booking cargo
        socket.on('book-cargo', async (bookingData) => {
            try {
                const bookingId = bookingData.bookingId;
                const booking = await prisma.booking.findUnique({
                    where: { id: bookingId },
                });
                if (!booking) throw new Error('Booking not found');
                await addDispatchJob(bookingId, booking.pickupLat, booking.pickupLng, 0, 0);

                socket.emit('dispatch-queued', { bookingId });

                // Auto-Accept Bot: Assign driver automatically after 3 seconds for single-user testing
                setTimeout(async () => {
                    try {
                        const currentBooking = await prisma.booking.findUnique({ where: { id: bookingId } });
                        if (currentBooking && currentBooking.status === 'PENDING' && !currentBooking.driverId) {
                            const driver = await prisma.user.findFirst({ where: { role: 'DRIVER' } });
                            if (driver) {
                                await acceptBooking(bookingId, driver.id);
                                io.to(`shipper:${currentBooking.shipperId}`).emit('booking-accepted', {
                                    bookingId,
                                    driverId: driver.id,
                                    driverName: driver.name,
                                });
                            }
                        }
                    } catch (err) {
                        console.error('Auto-accept bot error:', err);
                    }
                }, 3000);

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

        // Handle driver commitment to a scheduled cargo job
        socket.on('commit-scheduled-job', async ({ bookingId }) => {
            try {
                const { commitScheduledJob } = await import('@/services/matching.service');
                const booking = await commitScheduledJob(bookingId, user.id);

                // Notify the shipper their scheduled job now has a committed driver
                io.to(`shipper:${booking.shipperId}`).emit('scheduled-job-committed', {
                    bookingId: booking.id,
                    driverId: user.id,
                    driverName: user.name,
                    committedAt: booking.committedAt,
                });

                // Confirm back to the committing driver
                socket.emit('commit-confirmed', {
                    bookingId: booking.id,
                    scheduledAt: booking.scheduledAt,
                    message: 'You have successfully committed to this scheduled job.',
                });
            } catch (e: any) {
                socket.emit('error', { message: e.message });
            }
        });
    });
};
