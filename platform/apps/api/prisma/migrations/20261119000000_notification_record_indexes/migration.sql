-- CreateIndex
CREATE INDEX "NotificationRecord_type_sentAt_idx" ON "NotificationRecord"("type", "sentAt");

-- CreateIndex
CREATE INDEX "NotificationRecord_status_sentAt_idx" ON "NotificationRecord"("status", "sentAt");

-- CreateIndex
CREATE INDEX "NotificationRecord_recipient_idx" ON "NotificationRecord"("recipient");
