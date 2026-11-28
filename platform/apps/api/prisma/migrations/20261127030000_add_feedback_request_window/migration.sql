-- T-150 (ADR 0016): матеріалізоване вікно відгуку на завершений візит.
-- Нова таблиця, тож rolling deploy безпечний: старий код про неї не знає,
-- новий створює рядок лише на `AppointmentCompleted`.
CREATE TABLE "FeedbackRequestWindow" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "barberId" TEXT,
    "locationId" TEXT,
    "completedAt" TIMESTAMPTZ NOT NULL,
    "windowEndsAt" TIMESTAMPTZ NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "remindedAt" TIMESTAMPTZ,
    "submittedAt" TIMESTAMPTZ,
    "rating" INTEGER,
    "text" TEXT,
    "photos" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "FeedbackRequestWindow_pkey" PRIMARY KEY ("id")
);

-- Ключ дедуплікації: повторна доставка події не створює друге вікно.
CREATE UNIQUE INDEX "FeedbackRequestWindow_appointmentId_key" ON "FeedbackRequestWindow"("appointmentId");
CREATE INDEX "FeedbackRequestWindow_clientId_status_idx" ON "FeedbackRequestWindow"("clientId", "status");
CREATE INDEX "FeedbackRequestWindow_status_windowEndsAt_idx" ON "FeedbackRequestWindow"("status", "windowEndsAt");
