-- CreateIndex
CREATE INDEX "AppointmentActivity_type_processedAt_idx" ON "AppointmentActivity"("type", "processedAt");

-- CreateIndex
CREATE INDEX "ClientProfile_userId_idx" ON "ClientProfile"("userId");
