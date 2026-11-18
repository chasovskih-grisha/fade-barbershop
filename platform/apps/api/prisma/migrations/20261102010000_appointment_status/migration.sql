-- Життєвий цикл Appointment (T-042a): агрегат Appointment живе на рядку
-- Booking — статус і бронювання одна сутність БД, розходження неможливе.
ALTER TABLE "Booking" ADD COLUMN "appointmentId" TEXT;
ALTER TABLE "Booking" ADD COLUMN "status" TEXT;
ALTER TABLE "Booking" ADD COLUMN "cancelReason" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Booking_appointmentId_key" ON "Booking"("appointmentId");
