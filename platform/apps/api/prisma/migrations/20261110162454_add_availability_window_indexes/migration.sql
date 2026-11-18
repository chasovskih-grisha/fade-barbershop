-- DropIndex
-- Earlier migration 20261110141729 already drops two of these. IF EXISTS keeps
-- a fresh database from failing when the index is already gone.
DROP INDEX IF EXISTS "ClientProfile_phone_idx";

-- DropIndex
DROP INDEX IF EXISTS "OtpChallenge_phone_createdAt_idx";

-- DropIndex
DROP INDEX IF EXISTS "User_role_active_idx";
