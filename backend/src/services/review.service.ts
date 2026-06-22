import prisma from "@/config/database";
import { getBookingOrThrow } from "@/services/booking.service";
import { AppError } from "@/utils/AppError";

export const createDriverReview = async (
  bookingId: string,
  rating: number,
  comment: string,
  shipperId: string
) => {
  const booking = await getBookingOrThrow(bookingId);
  if (booking.status !== 'DELIVERED' && booking.status !== 'COMPLETED')
    throw new AppError('Can only review completed or delivered bookings', 400);
  if (booking.shipperId !== shipperId)
    throw new AppError('Unauthorized', 403);
  return prisma.review.create({ data: { bookingId, rating, comment } });
};

export const fileDispute = async (
  bookingId: string,
  reason: string,
  shipperId: string,
) => {
  const booking = await getBookingOrThrow(bookingId);
  if (booking.status !== 'DELIVERED') throw new AppError("Booking hasn't been delivered yet", 400);
  if (booking.shipperId !== shipperId) throw new AppError('Unauthorized', 403);
  return prisma.$transaction(async (tx) => {
    await tx.booking.update({ where: { id: bookingId }, data: { status: 'DISPUTED' } });
    return tx.dispute.create({ data: { bookingId, reason } });
  });
};
