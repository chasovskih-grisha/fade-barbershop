-- T-4619a: rollback deposit hold (reverse order of migration.sql).
DROP INDEX "DepositHold_barberId_startAt_idx";
DROP INDEX "DepositHold_status_expiresAt_idx";
DROP INDEX "DepositHold_appointmentId_key";
DROP TABLE "DepositHold";
