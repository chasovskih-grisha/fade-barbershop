-- T-4444: історія правил депозиту (PAY-ADM-09). Поточна версія лишається в
-- AppSetting; тут — незмінні снепшоти кожного затвердженого набору правил.
CREATE TABLE "DepositPolicyVersion" (
    "id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "percent" INTEGER NOT NULL,
    "rounding" INTEGER NOT NULL,
    "cancellationWindowHours" INTEGER NOT NULL,
    "createdBy" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DepositPolicyVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DepositPolicyVersion_version_key" ON "DepositPolicyVersion"("version");
CREATE INDEX "DepositPolicyVersion_createdAt_idx" ON "DepositPolicyVersion"("createdAt");
