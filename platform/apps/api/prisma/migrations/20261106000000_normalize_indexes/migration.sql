-- Нормалізація індексів Article/ClientProfile/NotificationRecord + phone.
--
-- Міграція спершу була створена як 20260930131357_user_email — тобто ПОЗНАЧкою
-- timestamp, за якою вона стояла раніше за міграції, що створюють ці таблиці
-- (20261102_article, 20261103_client_profile, 20261104_notification_record).
-- Через це на чистій БД вона падала на
-- `index "Article_createdAt_idx" does not exist`, а Prisma після помилки
-- блокував усі наступні міграції — разом з ними й таблиця ClientProfile.
-- Перейменовано в 20261106000000, щоб виконуватися після створення таблиць.
--
-- Зміст: індекси createdAt/publishedAt створюються знову без DESC (так їх
-- описує schema.prisma), з'являється індекс ClientProfile.phone, а
-- DEFAULT CURRENT_TIMESTAMP на updatedAt знімається — значення проставляє
-- Prisma (@updatedAt).

-- DropIndex
DROP INDEX IF EXISTS "Article_createdAt_idx";

-- DropIndex
DROP INDEX IF EXISTS "Article_status_publishedAt_idx";

-- DropIndex
DROP INDEX IF EXISTS "NotificationRecord_sentAt_idx";

-- AlterTable
ALTER TABLE "Article" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ClientProfile" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Article_status_publishedAt_idx" ON "Article"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Article_createdAt_idx" ON "Article"("createdAt");

-- CreateIndex
CREATE INDEX "ClientProfile_phone_idx" ON "ClientProfile"("phone");