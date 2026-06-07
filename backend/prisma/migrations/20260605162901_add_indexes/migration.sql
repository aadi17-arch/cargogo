-- CreateIndex
CREATE INDEX "bookings_shipperId_idx" ON "bookings"("shipperId");

-- CreateIndex
CREATE INDEX "bookings_driverId_idx" ON "bookings"("driverId");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");
