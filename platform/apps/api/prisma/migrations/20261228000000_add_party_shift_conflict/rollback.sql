-- T-4209: зворотний хід для partyId у конфліктах (T-4616a).
-- Індекс залежить від колонки, тому знімаємо його першим.
DROP INDEX IF EXISTS "ShiftConflict_partyId_status_idx";
ALTER TABLE "ShiftConflict" DROP COLUMN "partyId";
