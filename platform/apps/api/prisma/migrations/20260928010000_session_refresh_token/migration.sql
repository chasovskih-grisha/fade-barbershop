-- T-014: refresh-токени для каналу mobile (ADR 0005 access + refresh bearer).
-- Хеш поточного refresh (unique — CAS-ротація updateMany по where), one-step
-- історія для reuse-детекту, життя access-токена (хвилини) і refresh (тижні).
-- Web/admin живуть cookie-TTL — колонки там NULL.
ALTER TABLE "Session" ADD COLUMN "refreshTokenHash" TEXT;
ALTER TABLE "Session" ADD COLUMN "previousRefreshHash" TEXT;
ALTER TABLE "Session" ADD COLUMN "accessExpiresAt" TIMESTAMPTZ;
ALTER TABLE "Session" ADD COLUMN "refreshExpiresAt" TIMESTAMPTZ;
CREATE UNIQUE INDEX "Session_refreshTokenHash_key" ON "Session"("refreshTokenHash");
CREATE INDEX "Session_previousRefreshHash_idx" ON "Session"("previousRefreshHash");
