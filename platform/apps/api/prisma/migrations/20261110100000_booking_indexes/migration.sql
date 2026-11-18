-- CreateIndex
CREATE INDEX "Booking_locationId_start_end_idx" ON "Booking"("locationId", "start", "end");

CREATE INDEX "Booking_barberId_start_end_idx" ON "Booking"("barberId", "start", "end");

CREATE INDEX "Booking_clientId_idx" ON "Booking"("clientId");

CREATE INDEX "Booking_status_idx" ON "Booking"("status");
