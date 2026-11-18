-- Відкладена доставка outbox (T-080, нагадування про візит).
--
-- Рядок «notification.reminder.due» створюється одразу після запису/перенесення
-- візиту, але має настати за leadMinutes до початку. availableAt — час
-- спрацювання; релей бачить такий рядок лише коли availableAt <= now, тому
-- нагадування переживає рестарт (на відміну від таймера в пам'яті) і не
-- дублюється, бо журнал NotificationRecord тримає унікальний eventId.
--
-- NULL означає «доставити негайно» — усі існуючі рядки залишаються видимими
-- без зміни семантики попередніх споживачів (T-4608, T-4422).
--
-- Індекс (type, publishedAt, availableAt) — під вибірку релея
-- (type IN (...) AND publishedAt IS NULL AND (availableAt IS NULL OR availableAt <= now)).

-- AlterTable
ALTER TABLE "OutboxMessage" ADD COLUMN "availableAt" TIMESTAMPTZ(3);

-- CreateIndex
CREATE INDEX "OutboxMessage_type_publishedAt_availableAt_idx" ON "OutboxMessage"("type", "publishedAt", "availableAt");