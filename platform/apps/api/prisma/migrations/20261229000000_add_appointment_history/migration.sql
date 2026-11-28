-- Чат візиту (T-081): нова таблиця розмов і повідомлень; наявні дані не
-- чіпаємо, тому backfill не потрібен — розмова створюється при першому
-- повідомленні або першому відкритті чату візиту.

CREATE TABLE "ChatConversation" (
    "id" UUID NOT NULL,
    "visitId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "barberId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageAt" TIMESTAMPTZ,
    CONSTRAINT "ChatConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChatMessage" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "senderRole" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "clientMessageId" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChatConversation_visitId_key" ON "ChatConversation"("visitId");
CREATE INDEX "ChatConversation_clientId_lastMessageAt_idx" ON "ChatConversation"("clientId", "lastMessageAt");
CREATE INDEX "ChatConversation_barberId_lastMessageAt_idx" ON "ChatConversation"("barberId", "lastMessageAt");
CREATE UNIQUE INDEX "ChatMessage_conversationId_clientMessageId_key" ON "ChatMessage"("conversationId", "clientMessageId");
CREATE INDEX "ChatMessage_conversationId_createdAt_idx" ON "ChatMessage"("conversationId", "createdAt");

ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "ChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
