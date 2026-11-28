-- T-4209: зворотний хід для позначок доставки/прочитання чату (T-4432).
-- Індекс залежить від "readAt", тому його знімаємо першим.
DROP INDEX IF EXISTS "ChatMessage_conversationId_readAt_idx";
ALTER TABLE "ChatMessage" DROP COLUMN "readAt";
ALTER TABLE "ChatMessage" DROP COLUMN "deliveredAt";
