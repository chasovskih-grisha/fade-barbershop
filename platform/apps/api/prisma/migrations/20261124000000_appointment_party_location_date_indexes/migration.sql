-- CreateIndex
CREATE INDEX IF NOT EXISTS "AppointmentParty_locationId_date_idx" ON "AppointmentParty"("locationId", "date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AppointmentParty_barberId_date_idx" ON "AppointmentParty"("barberId", "date");
