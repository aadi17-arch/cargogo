import prisma from "@/config/database"
export const createDriverReview = async (
  bookingId: string,
  rating: number,
  comment: string,
  shipperId: string
) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId }
  });
  if (!booking || (booking.status !== 'DELIVERED' && booking.status !== 'COMPLETED'))
    throw new Error('Can only review completed or delivered bookings');
  if (booking.shipperId !== shipperId) return;
  const review = await prisma.review.create({
    data: {
      bookingId: bookingId,
      rating: rating,
      comment: comment
    }
  });
  return review;
};

export const fileDispute = async (
  bookingId: string,
  reason: string,
  shipperId: string,
) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId }
  });
  if (!booking || booking.status !== 'DELIVERED') throw new Error('Booking hasnt delivered yet!');
  if (booking.shipperId !== shipperId) throw new Error('Unauthorized');
  return prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: { status: 'DISPUTED' }
    });
    const dispute = await tx.dispute.create({
      data: {
        bookingId: bookingId,
        reason: reason
      }
    });
    return dispute;
  });
}
