-- T-091/T-093/T-094: rollback payment module (reverse order of migration.sql).
DROP INDEX "BookingPaymentState_refundStatus_idx";
DROP INDEX "BookingPaymentState_refundId_key";
DROP TABLE "BookingPaymentState";
DROP INDEX "Payment_clientId_idx";
DROP INDEX "Payment_status_idx";
DROP INDEX "Payment_appointmentId_idx";
DROP TABLE "Payment";
