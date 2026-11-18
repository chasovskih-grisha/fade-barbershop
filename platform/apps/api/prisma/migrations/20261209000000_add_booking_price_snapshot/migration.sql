-- T-090: снепшот ціни візиту (ADR 0006/0007). appliedDiscounts — застосовані
-- знижки на момент запису; finalPrice — підсумок (≥ 0, DSC-004). Обидва nullable:
-- наявні записи лишаються валідними (expand без backfill), код читає їх як null.
ALTER TABLE "Booking"
ADD COLUMN "appliedDiscounts" JSONB,
ADD COLUMN "finalPrice" INTEGER;
