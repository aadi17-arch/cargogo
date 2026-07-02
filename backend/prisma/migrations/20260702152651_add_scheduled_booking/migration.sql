-- CreateEnum
CREATE TYPE "BookingType" AS ENUM ('INSTANT', 'SCHEDULED');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "bookingType" "BookingType" NOT NULL DEFAULT 'INSTANT',
ADD COLUMN     "committedAt" TIMESTAMP(3),
ADD COLUMN     "scheduledAt" TIMESTAMP(3),
ADD COLUMN     "scheduledUntil" TIMESTAMP(3);
