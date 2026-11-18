-- T-4805: GDPR erasure requests. Expand-only: нова таблиця, старі інстанси її
-- не читають (engineering-principles.md §Міграції).
CREATE TABLE "AccountErasure" (
  "id" UUID NOT NULL,
  "subjectId" UUID NOT NULL,
  "phoneHash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "requestedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "nextAttemptAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMPTZ,
  "lastError" TEXT,
  "report" JSONB,
  CONSTRAINT "AccountErasure_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AccountErasure_subjectId_key" ON "AccountErasure"("subjectId");
CREATE INDEX "AccountErasure_status_nextAttemptAt_idx" ON "AccountErasure"("status", "nextAttemptAt");
