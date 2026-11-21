-- T-170 follow-up: rollback у зворотному порядку (спершу новий індекс/колонка).
DROP INDEX IF EXISTS "Service_name_duration_isAddon_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Service_name_duration_key" ON "Service"("name", "duration");
ALTER TABLE "Service" DROP COLUMN IF EXISTS "isAddon";
