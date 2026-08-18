import prisma from '@/config/database';
import { AppError } from '@/utils/AppError';

export const createChatMessage = async (bookingId: string, senderId: string, message: string) => {
  const cleanMessage = message?.trim();
  if (!cleanMessage) throw new AppError('Message cannot be empty', 400);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, shipperId: true, driverId: true }
  });

  if (!booking) throw new AppError('Shipment not found', 404);
  if (booking.shipperId !== senderId && booking.driverId !== senderId) {
    throw new AppError('Unauthorized: You are not a participant of this booking', 403);
  }

  return prisma.chatMessage.create({
    data: {
      bookingId,
      senderId,
      message: cleanMessage
    },
    include: {
      sender: {
        select: { id: true, name: true, role: true }
      }
    }
  });
};
