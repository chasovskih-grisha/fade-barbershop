-- T-4616a: партія — одна конфліктна одиниця. partyId зв'язує representative
-- booking із усіма ногами; соло-візити лишаються з NULL.
ALTER TABLE "ShiftConflict" ADD COLUMN "partyId" UUID;

CREATE INDEX "ShiftConflict_partyId_status_idx" ON "ShiftConflict"("partyId", "status");
