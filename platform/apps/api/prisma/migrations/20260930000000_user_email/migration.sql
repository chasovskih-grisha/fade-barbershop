-- T-4422: email клієнта — адреса сповіщень безпеки (новий вхід, «вийти
-- скрізь»). ADR 0005: вхід по телефону, email у логін не задіяний; клієнт
-- зберігає його сам у кабінеті. NULL = не задано (сповіщення вимкнені).
ALTER TABLE "User" ADD COLUMN "email" TEXT;
CREATE UNIQUE INDEX "User_email_key" ON "User" ("email");
