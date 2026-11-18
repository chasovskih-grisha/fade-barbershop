-- T-4542: online booking restrictions per location (+ one global default row).
-- Expand-only: нова таблиця, нічого не змінює в наявних.
CREATE TABLE "OnlineBookingPolicy" (
  "id" UUID NOT NULL,
  "locationId" UUID,
  "minLeadMinutes" INTEGER NOT NULL DEFAULT 60,
  "maxHorizonDays" INTEGER NOT NULL DEFAULT 30,
  "cancellationDeadlineHours" INTEGER NOT NULL DEFAULT 12,
  "rescheduleDeadlineHours" INTEGER NOT NULL DEFAULT 12,
  "maxActiveBookings" INTEGER NOT NULL DEFAULT 2,
  "allowGuestBooking" BOOLEAN NOT NULL DEFAULT true,
  "blockNoShowsCount" INTEGER NOT NULL DEFAULT 3,
  "blockNoShowsWindowDays" INTEGER NOT NULL DEFAULT 180,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OnlineBookingPolicy_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OnlineBookingPolicy_locationId_key" ON "OnlineBookingPolicy"("locationId");
