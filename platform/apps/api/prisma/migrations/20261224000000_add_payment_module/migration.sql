-- Payment module (T-091/T-093/T-094): durable deposit, on-site payment and
-- refund ledger. Additive tables only; Booking is untouched for zero-downtime.
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "appointmentId" UUID,
    "orderId" TEXT,
    "clientId" UUID,
    "amount" INTEGER NOT NULL,
    "form" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "receiptId" TEXT,
    "refundReason" TEXT,
    "refundedAmount" INTEGER NOT NULL DEFAULT 0,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Payment_appointmentId_idx" ON "Payment"("appointmentId");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
CREATE INDEX "Payment_clientId_idx" ON "Payment"("clientId");

CREATE TABLE "BookingPaymentState" (
    "bookingId" UUID NOT NULL,
    "status" TEXT,
    "requiresPayment" BOOLEAN,
    "paymentMethod" TEXT,
    "depositStatus" TEXT,
    "discountReason" TEXT,
    "refundId" TEXT,
    "refundStatus" TEXT,
    "refundInitiatedAt" TIMESTAMPTZ,
    "refundReason" TEXT,
    "refundReasonCode" TEXT,
    "refundMetadata" TEXT,
    "capturedRefundAmount" INTEGER,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "BookingPaymentState_pkey" PRIMARY KEY ("bookingId")
);

CREATE UNIQUE INDEX "BookingPaymentState_refundId_key" ON "BookingPaymentState"("refundId");
CREATE INDEX "BookingPaymentState_refundStatus_idx" ON "BookingPaymentState"("refundStatus");
