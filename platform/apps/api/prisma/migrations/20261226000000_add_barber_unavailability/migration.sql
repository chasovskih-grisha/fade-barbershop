-- T-4616a: недоступність барбера та один відкритий конфлікт на візит.
CREATE TABLE "BarberUnavailability" (
    "id" TEXT NOT NULL,
    "barberId" UUID NOT NULL,
    "locationId" UUID,
    "start" TIMESTAMPTZ NOT NULL,
    "end" TIMESTAMPTZ NOT NULL,
    "reason" TEXT,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BarberUnavailability_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BarberUnavailability_barberId_start_end_idx" ON "BarberUnavailability"("barberId", "start", "end");
CREATE INDEX "BarberUnavailability_locationId_start_end_idx" ON "BarberUnavailability"("locationId", "start", "end");

CREATE TABLE "ShiftConflict" (
    "id" TEXT NOT NULL,
    "appointmentId" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "barberId" UUID NOT NULL,
    "locationId" UUID NOT NULL,
    "clientId" UUID,
    "serviceId" UUID,
    "start" TIMESTAMPTZ NOT NULL,
    "end" TIMESTAMPTZ NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolution" TEXT,
    "resolvedBarberId" UUID,
    "resolvedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ShiftConflict_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ShiftConflict_bookingId_key" ON "ShiftConflict"("bookingId");
CREATE INDEX "ShiftConflict_status_start_idx" ON "ShiftConflict"("status", "start");
CREATE INDEX "ShiftConflict_barberId_status_idx" ON "ShiftConflict"("barberId", "status");
CREATE INDEX "ShiftConflict_locationId_status_idx" ON "ShiftConflict"("locationId", "status");
