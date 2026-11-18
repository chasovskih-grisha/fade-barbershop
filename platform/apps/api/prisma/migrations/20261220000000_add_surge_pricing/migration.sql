-- T-4811: surge pricing rules + snapshot on bookings. Expand-only:
-- нова таблиця й два nullable-стовпці, старі рядки лишаються валідними.
CREATE TABLE "SurgeRule" (
  "id" UUID NOT NULL,
  "locationId" UUID,
  "dayOfWeek" INTEGER,
  "fromMinute" INTEGER,
  "toMinute" INTEGER,
  "seniorityTier" TEXT,
  "multiplierBp" INTEGER NOT NULL DEFAULT 10000,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SurgeRule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SurgeRule_locationId_active_idx" ON "SurgeRule"("locationId", "active");

ALTER TABLE "Booking" ADD COLUMN "surgeBasisPoints" INTEGER;
ALTER TABLE "Booking" ADD COLUMN "surgeRuleId" UUID;
