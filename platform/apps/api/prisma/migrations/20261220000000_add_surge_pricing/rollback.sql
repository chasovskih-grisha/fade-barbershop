-- T-4811: rollback surge pricing (reverse order of migration.sql).
ALTER TABLE "Booking" DROP COLUMN "surgeRuleId";
ALTER TABLE "Booking" DROP COLUMN "surgeBasisPoints";
DROP INDEX "SurgeRule_locationId_active_idx";
DROP TABLE "SurgeRule";
