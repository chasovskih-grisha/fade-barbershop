-- AlterTable
ALTER TABLE "Booking"
ADD COLUMN "depositAmount" INTEGER,
ADD COLUMN "depositPercent" INTEGER,
ADD COLUMN "depositRounding" INTEGER,
ADD COLUMN "cancellationWindowHours" INTEGER;
