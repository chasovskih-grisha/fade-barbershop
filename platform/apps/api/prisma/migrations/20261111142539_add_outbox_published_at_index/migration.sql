-- These drops were generated against a database that already had later
-- objects. On a database that has only applied earlier migrations,
-- ClientNotificationPreference and User_role_idx do not exist yet
-- (they are created in 20261118 and 20261117). Unconditional DROP/ALTER
-- abort the migration (P3009) and block every later migration and the seed.
DROP INDEX IF EXISTS "ClientNotificationPreference_clientId_idx";
DROP INDEX IF EXISTS "OtpChallenge_phone_createdAt_idx";
DROP INDEX IF EXISTS "User_role_idx";

DO $$
BEGIN
  IF to_regclass('"ClientNotificationPreference"') IS NOT NULL THEN
    ALTER TABLE "ClientNotificationPreference" ALTER COLUMN "updatedAt" DROP DEFAULT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "OutboxMessage_publishedAt_idx" ON "OutboxMessage"("publishedAt");
