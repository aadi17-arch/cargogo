import { SocketIOServer } from '@/sockets/socket.server';
import { acceptBooking } from '@/services/matching.service';
import { commitToScheduledJob, getBookingOrThrow } from '@/services/booking.service';
import { createChatMessage } from '@/services/chat.service';
import prisma from '@/config/database';
import { addDispatchJob, dispatchQueue } from '@/queues/dispatch.queue';
import { env } from '@/config/env.config';
import { SOCKET_ROOMS, SOCKET_EVENTS } from '@/config/socket-events';

export const registerMatchingHandlers = (
    io: SocketIOServer
) => {
    io.on('connection', (socket) => {
        const user = socket.data.user;
        if (!user) return;

        if (user.role === 'DRIVER' && (user as any).driverProfile) {
            socket.join(SOCKET_ROOMS.driver(user.id));
        } else if (user.role === 'SHIPPER') {
            socket.join(SOCKET_ROOMS.shipper(user.id));
        }

        socket.on(SOCKET_EVENTS.BOOK_CARGO, async (bookingData) => {
            try {
                const bookingId = bookingData?.bookingId;
                const booking = await getBookingOrThrow(bookingId);
                await addDispatchJob(bookingId, booking.pickupLat, booking.pickupLng, 0, 0);

                socket.emit(SOCKET_EVENTS.DISPATCH_QUEUED, { bookingId });

                const isTestBotEnabled = env.NODE_ENV !== 'production' && env.AUTO_ACCEPT_TEST_BOT === true;

                if (isTestBotEnabled) {
                    setTimeout(async () => {
                        try {
                            const currentBooking = await prisma.booking.findUnique({ where: { id: bookingId } });
                            if (currentBooking && currentBooking.status === 'PENDING' && !currentBooking.driverId) {
                                const driver = await prisma.user.findFirst({ where: { role: 'DRIVER' } });
                                if (driver) {
                                    await acceptBooking(bookingId, driver.id);
                                    io.to(SOCKET_ROOMS.shipper(currentBooking.shipperId)).emit(SOCKET_EVENTS.BOOKING_ACCEPTED, {
                                        bookingId,
                                        driverId: driver.id,
                                        driverName: driver.name,
                                    });
                                }
                            }
                        } catch (err) {
                            console.error('[TestBot] Auto-accept bot error:', err);
                        }
                    }, 60000);
                }

            }
            catch (e: any) {
                socket.emit(SOCKET_EVENTS.ERROR, { message: e.message });
            }
        });

        socket.on(SOCKET_EVENTS.ACCEPT_BID, async ({ bookingId }) => {
            try {
                const booking = await acceptBooking(bookingId, user.id);

                const jobs = await dispatchQueue.getJobs(['delayed', 'waiting']);
                for (const j of jobs) {
                    if (j.data.bookingId === bookingId) await j.remove();
                }

                io.to(SOCKET_ROOMS.shipper(booking.shipperId)).emit(SOCKET_EVENTS.BOOKING_ACCEPTED, {
                    bookingId,
                    driverId: user.id,
                    driverName: user.name,
                });
                socket.emit(SOCKET_EVENTS.BID_ACCEPTED, { bookingId });
            } catch (e: any) {
                socket.emit(SOCKET_EVENTS.ERROR, { message: e.message });
            }
        });

        socket.on(SOCKET_EVENTS.REJECT_BID, async ({ bookingId }) => {
            try {
                const jobs = await dispatchQueue.getJobs(['delayed', 'waiting']);
                let nextDriverIndex = 0;
                let pickupLat = 0;
                let pickupLng = 0;

                for (const j of jobs) {
                    if (j.data.bookingId === bookingId) {
                        nextDriverIndex = (j.data.driverIndex || 0) + 1;
                        pickupLat = j.data.pickupLat;
                        pickupLng = j.data.pickupLng;
                        await j.remove();
                    }
                }

                if (pickupLat && pickupLng) {
                    await addDispatchJob(bookingId, pickupLat, pickupLng, nextDriverIndex, 0);
                }

                socket.emit(SOCKET_EVENTS.BID_REJECTED, {
                    bookingId,
                    message: 'Rejected. Moving to the next driver.'
                });
            } catch (e: any) {
                socket.emit(SOCKET_EVENTS.ERROR, { message: e.message });
            }
        });

        socket.on(SOCKET_EVENTS.COMMIT_SCHEDULED_JOB, async ({ bookingId }) => {
            try {
                const booking = await commitToScheduledJob(bookingId, user.id);

                io.to(SOCKET_ROOMS.shipper(booking.shipperId)).emit(SOCKET_EVENTS.SCHEDULED_JOB_COMMITTED, {
                    bookingId: booking.id,
                    driverId: user.id,
                    driverName: user.name,
                    committedAt: booking.committedAt,
                });

                socket.emit(SOCKET_EVENTS.COMMIT_CONFIRMED, {
                    bookingId: booking.id,
                    scheduledAt: booking.scheduledAt,
                    message: 'You have successfully committed to this scheduled job.',
                });
            } catch (e: any) {
                socket.emit(SOCKET_EVENTS.ERROR, { message: e.message });
            }
        });

        socket.on(SOCKET_EVENTS.JOIN_CHAT, ({ bookingId }) => {
            socket.join(SOCKET_ROOMS.chat(bookingId));
        });

        socket.on(SOCKET_EVENTS.SEND_CHAT_MESSAGE, async ({ bookingId, message }) => {
            try {
                const chatMsg = await createChatMessage(bookingId, user.id, message);
                io.to(SOCKET_ROOMS.chat(bookingId)).emit(SOCKET_EVENTS.RECEIVE_CHAT_MESSAGE, chatMsg);
            } catch (e: any) {
                socket.emit(SOCKET_EVENTS.ERROR, { message: e.message });
            }
        });
    });
};
