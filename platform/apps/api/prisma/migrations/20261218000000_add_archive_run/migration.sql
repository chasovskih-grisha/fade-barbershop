-- T-4804: audit of booking archiving runs. Expand-only: нова таблиця.
CREATE TABLE "ArchiveRun" (
  "id" UUID NOT NULL,
  "cutoff" TIMESTAMPTZ NOT NULL,
  "archived" INTEGER NOT NULL,
  "remaining" INTEGER NOT NULL DEFAULT 0,
  "keys" JSONB NOT NULL,
  "checksums" JSONB NOT NULL,
  "ranAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ArchiveRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ArchiveRun_ranAt_idx" ON "ArchiveRun"("ranAt");
