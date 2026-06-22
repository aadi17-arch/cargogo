-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "dropoffAddress" TEXT NOT NULL DEFAULT 'Unknown Dropoff Address',
ADD COLUMN     "pickupAddress" TEXT NOT NULL DEFAULT 'Unknown Pickup Address';
