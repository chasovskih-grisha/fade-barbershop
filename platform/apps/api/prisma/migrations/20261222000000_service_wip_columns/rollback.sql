-- T-170 follow-up: rollback у зворотному порядку (спершу останні колонки).
ALTER TABLE "Service" DROP COLUMN IF EXISTS "consumableItems";
ALTER TABLE "Service" DROP COLUMN IF EXISTS "commissionPercent";
ALTER TABLE "Service" DROP COLUMN IF EXISTS "resourceIds";
ALTER TABLE "Service" DROP COLUMN IF EXISTS "cleanupMinutes";
ALTER TABLE "Service" DROP COLUMN IF EXISTS "packageItems";
