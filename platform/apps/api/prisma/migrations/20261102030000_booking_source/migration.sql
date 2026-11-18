-- Джерело бронювання (T-046; WALK-ADM-03-семантика): канал запису для
-- аналітики (ANL-004) — 'web' | 'admin' | 'walk_in' | 'mobile'. Клиент —
-- лише посилання (ID з identity/CRM), scheduling не володіє профілем.
ALTER TABLE "Booking" ADD COLUMN "clientId" TEXT;
ALTER TABLE "Booking" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'web';
