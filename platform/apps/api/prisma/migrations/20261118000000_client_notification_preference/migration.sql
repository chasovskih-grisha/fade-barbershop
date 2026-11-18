-- CreateTable
CREATE TABLE "ClientNotificationPreference" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "loyaltyOptOut" BOOLEAN NOT NULL DEFAULT false,
    "reminderOptOut" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientNotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientNotificationPreference_clientId_key" ON "ClientNotificationPreference"("clientId");

-- CreateIndex
CREATE INDEX "ClientNotificationPreference_clientId_idx" ON "ClientNotificationPreference"("clientId");
