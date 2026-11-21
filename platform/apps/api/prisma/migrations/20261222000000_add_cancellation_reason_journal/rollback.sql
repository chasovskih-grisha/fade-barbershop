-- T-4560: rollback cancellation reason journal (reverse order of migration.sql).
DROP INDEX "CancellationReasonJournal_kind_recordedAt_idx";
DROP INDEX "CancellationReasonJournal_locationId_recordedAt_idx";
DROP INDEX "CancellationReasonJournal_barberId_recordedAt_idx";
DROP INDEX "CancellationReasonJournal_appointmentId_kind_idx";
DROP TABLE "CancellationReasonJournal";
