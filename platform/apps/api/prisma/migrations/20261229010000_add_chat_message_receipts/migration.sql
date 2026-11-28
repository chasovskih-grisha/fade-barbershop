-- T-4432: позначки доставки й прочитання повідомлення чату. Обидві колонки
-- додаткові й нульові за замовчуванням, тож старий код і rolling deploy
-- працюють без змін: до першої позначки рядок просто «не доставлено».
ALTER TABLE "ChatMessage" ADD COLUMN "deliveredAt" TIMESTAMPTZ;
ALTER TABLE "ChatMessage" ADD COLUMN "readAt" TIMESTAMPTZ;

CREATE INDEX "ChatMessage_conversationId_readAt_idx" ON "ChatMessage"("conversationId", "readAt");
