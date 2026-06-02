-- Add vehicleType column with a default for existing rows, then make it required
ALTER TABLE "bookings" ADD COLUMN "vehicleType" TEXT NOT NULL DEFAULT 'MINI_TEMPO';

-- Create the enum type if it doesn't already cover this (Prisma may have it already)
-- Update existing rows to MINI_TEMPO (already done by the DEFAULT above)
-- Optionally: ALTER TABLE "bookings" ALTER COLUMN "vehicleType" DROP DEFAULT;
