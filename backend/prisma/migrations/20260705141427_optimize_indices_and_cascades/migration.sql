-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_shipperId_fkey";

-- CreateIndex
CREATE INDEX "bookings_scheduledAt_idx" ON "bookings"("scheduledAt");

-- CreateIndex
CREATE INDEX "bookings_bookingType_idx" ON "bookings"("bookingType");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_shipperId_fkey" FOREIGN KEY ("shipperId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
