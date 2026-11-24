-- T-230: журнал змін графіка барбера.
CREATE TABLE "ScheduleChangeLog" (
    "id" UUID NOT NULL,
    "barberId" UUID NOT NULL,
    "locationId" UUID NOT NULL,
    "source" TEXT NOT NULL,
    "changedBy" UUID NOT NULL,
    "occurredAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previous" JSONB NOT NULL,
    "next" JSONB NOT NULL,

    CONSTRAINT "ScheduleChangeLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ScheduleChangeLog_barberId_occurredAt_idx"
    ON "ScheduleChangeLog"("barberId", "occurredAt");
CREATE INDEX "ScheduleChangeLog_locationId_occurredAt_idx"
    ON "ScheduleChangeLog"("locationId", "occurredAt");

-- T-4458: заявки на зміну часу та ідемпотентна згода клієнта.
CREATE TABLE "ScheduleChangeRequest" (
    "id" UUID NOT NULL,
    "appointmentId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "currentSlot" JSONB NOT NULL,
    "requestedSlot" JSONB,
    "status" TEXT NOT NULL,
    "requestedAt" TIMESTAMPTZ NOT NULL,
    "proposal" JSONB,
    "rejection" JSONB,
    "agreement" JSONB,
    "agreementEventId" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ScheduleChangeRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ScheduleChangeRequest_agreementEventId_key"
    ON "ScheduleChangeRequest"("agreementEventId");
CREATE INDEX "ScheduleChangeRequest_status_requestedAt_idx"
    ON "ScheduleChangeRequest"("status", "requestedAt");
CREATE INDEX "ScheduleChangeRequest_appointmentId_idx"
    ON "ScheduleChangeRequest"("appointmentId");
CREATE INDEX "ScheduleChangeRequest_clientId_idx"
    ON "ScheduleChangeRequest"("clientId");
