-- T-4587: server-side Amplitude outbox. Expand-only: нова таблиця.
CREATE TABLE "AmplitudeOutbox" (
  "id" UUID NOT NULL,
  "sourceEventId" UUID NOT NULL,
  "eventName" TEXT NOT NULL,
  "insertId" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastError" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMPTZ,
  CONSTRAINT "AmplitudeOutbox_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AmplitudeOutbox_sourceEventId_key" ON "AmplitudeOutbox"("sourceEventId");
CREATE INDEX "AmplitudeOutbox_status_nextAttemptAt_idx" ON "AmplitudeOutbox"("status", "nextAttemptAt");
