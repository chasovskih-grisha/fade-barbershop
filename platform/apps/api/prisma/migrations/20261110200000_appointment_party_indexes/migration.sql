-- CreateIndex
CREATE INDEX "AppointmentParty_date_idx" ON "AppointmentParty"("date");

CREATE INDEX "AppointmentParty_locationId_idx" ON "AppointmentParty"("locationId");

CREATE INDEX "AppointmentParty_barberId_idx" ON "AppointmentParty"("barberId");

CREATE INDEX "AppointmentParty_userId_idx" ON "AppointmentParty"("userId");
