-- T-4560: append-only журнал причин скасувань і no-show.
CREATE TABLE "CancellationReasonJournal" (
    "id" TEXT NOT NULL,
    "appointmentId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "barberId" UUID NOT NULL,
    "serviceId" UUID,
    "locationId" UUID NOT NULL,
    "channel" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "reason" TEXT,
    "customReason" TEXT,
    "noShowReason" TEXT,
    "excused" BOOLEAN NOT NULL DEFAULT false,
    "cancelledBy" TEXT NOT NULL,
    "startedAt" TIMESTAMPTZ NOT NULL,
    "recordedAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CancellationReasonJournal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CancellationReasonJournal_appointmentId_kind_idx" ON "CancellationReasonJournal"("appointmentId", "kind");
CREATE INDEX "CancellationReasonJournal_barberId_recordedAt_idx" ON "CancellationReasonJournal"("barberId", "recordedAt");
CREATE INDEX "CancellationReasonJournal_locationId_recordedAt_idx" ON "CancellationReasonJournal"("locationId", "recordedAt");
CREATE INDEX "CancellationReasonJournal_kind_recordedAt_idx" ON "CancellationReasonJournal"("kind", "recordedAt");
