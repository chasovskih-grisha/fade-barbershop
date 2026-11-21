-- T-170 follow-up: add Service columns introduced by the WIP schema but never migrated.

ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "packageItems" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "cleanupMinutes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "resourceIds" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "commissionPercent" INTEGER;
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "consumableItems" TEXT[] NOT NULL DEFAULT '{}';
