-- Сповіщення (notifications, T-4608): журнал email, відправлених споживачем
-- подій outbox. Один рядок на подію: eventId унікальний (патерн T-042c) —
-- повторна доставка не дублює листа. Успіх = рядок 'sent' ПІСЛЯ відправки;
-- 'skipped' (немає одержувача) — теж у журналі; 'failed' НЕ пишеться —
-- падіння send лишає подію pending для нової спроби (at-least-once).
CREATE TABLE "NotificationRecord" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "detail" TEXT,
    "sentAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationRecord_pkey" PRIMARY KEY ("id")
);

-- Дедуплікація redelivery + журнал «що кому коли» для підтримки.
CREATE UNIQUE INDEX "NotificationRecord_eventId_key" ON "NotificationRecord"("eventId");
CREATE INDEX "NotificationRecord_sentAt_idx" ON "NotificationRecord"("sentAt" DESC);
