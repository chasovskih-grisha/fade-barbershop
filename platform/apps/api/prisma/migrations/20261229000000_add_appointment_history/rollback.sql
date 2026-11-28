-- T-4209: зворотний хід для чату візиту (T-081).
-- "ChatMessage" має FK на "ChatConversation", тому повідомлення знімаємо першими.
DROP TABLE IF EXISTS "ChatMessage";
DROP TABLE IF EXISTS "ChatConversation";
