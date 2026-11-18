-- Референс зачіски + коментар у записі (T-043): scheduling зберігає лише
-- HaircutReferenceId (ID із haircut-ai або зовнішнього upload — інваріант
-- bounded-contexts: без копіювання фото) і AppointmentComment (plain text ≤500).
ALTER TABLE "Booking" ADD COLUMN "haircutReferenceId" TEXT;
ALTER TABLE "Booking" ADD COLUMN "appointmentComment" TEXT;
