-- T-4405: структурована адреса локації (expand-фаза).
-- Legacy `address` лишається display-рядком; нові колонки nullable, щоб
-- існуючі рядки не втратили дані. Backfill переносить повний legacy-текст у
-- street без regex-парсингу — адмін підтверджує структуру в UI.
ALTER TABLE "Location"
  ADD COLUMN "street" TEXT,
  ADD COLUMN "building" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "postalCode" TEXT,
  ADD COLUMN "country" TEXT;

UPDATE "Location" SET "street" = "address", "country" = 'UA' WHERE "street" IS NULL;
