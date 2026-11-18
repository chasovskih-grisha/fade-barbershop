-- T-4409: верифікований телефон клієнта (OTP для телефонного запису).
-- NULL = номер ще не верифіковано; дата = час успішної верифікації коду.
ALTER TABLE "User" ADD COLUMN "phoneVerifiedAt" TIMESTAMPTZ;
