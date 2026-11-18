-- T-061: read-model історії візитів (crm). Проєкція подій scheduling;
-- appointmentId — ключ ідемпотентності. Нове доповнення (без backfill на цьому
-- кроці: проєкція наповнюється подіями; історичний backfill — окремий крок).
CREATE TABLE "Visit" (
    "appointmentId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "barberId" UUID,
    "locationId" UUID,
    "status" TEXT NOT NULL,
    "start" TEXT,
    "end" TEXT,
    "occurredAt" TIMESTAMPTZ NOT NULL,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("appointmentId")
);

CREATE INDEX "Visit_clientId_occurredAt_idx" ON "Visit"("clientId", "occurredAt");
CREATE INDEX "Visit_barberId_occurredAt_idx" ON "Visit"("barberId", "occurredAt");
