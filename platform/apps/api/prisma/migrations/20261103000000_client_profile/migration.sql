-- CRM (T-4606): профіль клієнта — розширення над identity User (один до одного
-- по userId). Переваги і нотатки — JSON-масиви об'єктів: значення без пошуку і
-- без зовнішніх ключів, компактні для v1-скоупу; розбиття на таблиці — коли
-- з'явиться пошук/фільтр по нотатках (окрема міграція expand/contract).
-- VIP-знижка — відсоток (валідується доменом 0–100), лояльність — лічильник візитів.
CREATE TABLE "ClientProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT NOT NULL,
    "preferences" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "notes" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "vipDiscountPercent" INTEGER,
    "loyaltyVisitsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientProfile_pkey" PRIMARY KEY ("id")
);

-- Пошук адмінського списку клієнтів: за іменем, телефоном, userId.
CREATE UNIQUE INDEX "ClientProfile_userId_key" ON "ClientProfile" ("userId");
CREATE UNIQUE INDEX "ClientProfile_phone_key" ON "ClientProfile" ("phone");
CREATE INDEX "ClientProfile_createdAt_idx" ON "ClientProfile" ("createdAt" DESC);
