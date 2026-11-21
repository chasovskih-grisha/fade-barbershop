-- T-4619a: 15-хвилинне утримання крісла під незаплачений депозит.
CREATE TABLE "DepositHold" (
    "id" TEXT NOT NULL,
    "appointmentId" UUID NOT NULL,
    "barberId" UUID NOT NULL,
    "locationId" UUID NOT NULL,
    "startAt" TIMESTAMPTZ NOT NULL,
    "endAt" TIMESTAMPTZ NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "depositAmount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "DepositHold_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DepositHold_appointmentId_key" ON "DepositHold"("appointmentId");
CREATE INDEX "DepositHold_status_expiresAt_idx" ON "DepositHold"("status", "expiresAt");
CREATE INDEX "DepositHold_barberId_startAt_idx" ON "DepositHold"("barberId", "startAt");
