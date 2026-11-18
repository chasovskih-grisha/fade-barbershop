-- T-4730: необов'язковий день народження клієнта — лише день і місяць,
-- без року. Порожнє значення (NULL) — дефолт; очищення ставить NULL.
ALTER TABLE "ClientProfile"
    ADD COLUMN "birthDay" INTEGER,
    ADD COLUMN "birthMonth" INTEGER;
