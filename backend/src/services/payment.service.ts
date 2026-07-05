import prisma from '@/config/database';
import { AppError } from '@/utils/AppError';

export const processMockPayemnt = async (
  bookingId: string,
  paymentMethod: string,
  amount: number
) => {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId }
    });
    if (!booking) throw new AppError('Booking not found', 404);
    
    const existingPayment = await tx.payment.findFirst({
      where: {
        bookingId,
        status: 'SUCCESS'
      }
    });
    if (existingPayment) return existingPayment;

    if (booking.status !== 'DELIVERED') throw new AppError('Booking is not delivered yet', 400);

    await tx.booking.update({
      where: { id: bookingId },
      data: { status: 'COMPLETED' }
    });
    const txID = `TX-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    const payment = await tx.payment.create({
      data: {
        bookingId: bookingId,
        transactionId: txID,
        amount: amount,
        paymentMethod: paymentMethod,
        status: 'SUCCESS'
      }
    });
    return payment;
  });
};
