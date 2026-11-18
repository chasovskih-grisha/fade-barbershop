-- DropIndex
DROP INDEX IF EXISTS "ClientProfile_createdAt_idx";

-- DropIndex
DROP INDEX IF EXISTS "OtpChallenge_phone_createdAt_idx";

-- DropIndex
DROP INDEX IF EXISTS "User_role_active_idx";

-- AlterTable
ALTER TABLE "LocationSlotPolicy" ADD COLUMN     "timeZone" TEXT NOT NULL DEFAULT 'Europe/Kyiv';

-- CreateTable
CREATE TABLE "BarberPhoto" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "consentAt" TIMESTAMPTZ,
    "consentBy" TEXT,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "BarberPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BarberPhoto_userId_key" ON "BarberPhoto"("userId");

-- CreateIndex
CREATE INDEX "OtpChallenge_phone_expiresAt_idx" ON "OtpChallenge"("phone", "expiresAt");

-- AddForeignKey
ALTER TABLE "BarberPhoto" ADD CONSTRAINT "BarberPhoto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
