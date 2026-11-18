-- CreateTable
CREATE TABLE "BarberServiceAssignment" (
    "id" TEXT NOT NULL,
    "barberId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "BarberServiceAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationSlotPolicy" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "stepMinutes" INTEGER NOT NULL DEFAULT 15,
    "bufferMinutes" INTEGER NOT NULL DEFAULT 0,
    "horizonDays" INTEGER NOT NULL DEFAULT 14,
    "lastMinuteMinutes" INTEGER NOT NULL DEFAULT 60,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "LocationSlotPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BarberServiceAssignment_locationId_serviceId_active_idx" ON "BarberServiceAssignment"("locationId", "serviceId", "active");

-- CreateIndex
CREATE INDEX "BarberServiceAssignment_barberId_locationId_serviceId_idx" ON "BarberServiceAssignment"("barberId", "locationId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "BarberServiceAssignment_barberId_locationId_serviceId_key" ON "BarberServiceAssignment"("barberId", "locationId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "LocationSlotPolicy_locationId_key" ON "LocationSlotPolicy"("locationId");

-- CreateIndex
CREATE INDEX "idx_location_slot_policy" ON "LocationSlotPolicy"("locationId");
