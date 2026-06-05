import prisma from '@/config/database';
import { AppError } from '@/utils/AppError';

export const processMockPayemnt = async (
  bookingId: string,
  paymentMethod: string,
  amount: number
) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId }
  });
  if (!booking) throw new AppError('Booking not found',404);
  if (booking.status !== 'DELIVERED') throw new AppError('Booking is not delivered yet',400);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const updateBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'COMPLETED' }
  });
  return {
    transactionId: `TX-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
    bookingId: bookingId,
    amount: amount,
    paymentMethod: paymentMethod,
    status: 'SUCCESS',
    timestamp: new Date()
  };
};
