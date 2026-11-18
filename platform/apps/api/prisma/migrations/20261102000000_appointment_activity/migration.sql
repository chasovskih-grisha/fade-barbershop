-- Журнал оброблених подій (T-042c, патерн ADR 0009): eventId унікальний —
-- повторна доставка outbox не дублює ефектів обробника-еталона.
CREATE TABLE "AppointmentActivity" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "note" TEXT,
    "processedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentActivity_eventId_key" ON "AppointmentActivity"("eventId");
