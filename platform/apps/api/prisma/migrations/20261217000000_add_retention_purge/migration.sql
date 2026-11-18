-- T-4490: audit of retention purges. Expand-only: нова таблиця.
CREATE TABLE "RetentionPurge" (
  "id" UUID NOT NULL,
  "dataset" TEXT NOT NULL,
  "cutoff" TIMESTAMPTZ NOT NULL,
  "purged" INTEGER NOT NULL,
  "remainingExpired" INTEGER NOT NULL DEFAULT 0,
  "held" BOOLEAN NOT NULL DEFAULT false,
  "ranAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RetentionPurge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RetentionPurge_ranAt_idx" ON "RetentionPurge"("ranAt");
