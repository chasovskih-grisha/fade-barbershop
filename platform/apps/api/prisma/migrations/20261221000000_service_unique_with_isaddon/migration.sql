-- T-170 follow-up: Service unique key now includes isAddon (additive widening).
-- The `isAddon` column was added to the schema alongside the widened unique key,
-- but no migration carried them together; deploy both here.

ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "isAddon" BOOLEAN NOT NULL DEFAULT false;

-- Replace legacy two-column unique (name, duration) with compound unique (name, duration, isAddon)
DROP INDEX IF EXISTS "Service_name_duration_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Service_name_duration_isAddon_key" ON "Service"("name", "duration", "isAddon");
