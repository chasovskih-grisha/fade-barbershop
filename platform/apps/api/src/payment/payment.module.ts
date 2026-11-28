/* eslint-disable max-params, max-lines -- Nest factory providers receive one parameter per injected token; wiring stays in one place. */
import { Module } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { StripeAcquiringGateway } from '../billing/infrastructure/stripe-acquiring.gateway';
import { CheckboxFiscalGateway } from './application/checkbox-fiscal-gateway';
import { DepositFlow } from './application/deposit-flow.use-case';
import { OnsitePayment } from './application/onsite-payment.use-case';
import { T094Refund } from './application/refund.use-case';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { DepositHoldService } from '../scheduling/application/deposit-hold.service';
import { PaymentController } from './payment.controller';
import { AdminPaymentsController } from './infrastructure/admin-payments.controller';
import { BarberPaymentsController } from './infrastructure/barber-payments.controller';
import { StripeWebhookController } from './infrastructure/stripe-webhook.controller';
import { PrismaBillingPaymentRepository } from './infrastructure/prisma-billing-payment.repository';
import { PrismaBillingOutboxPublisher } from './infrastructure/prisma-billing-outbox.publisher';
import { SettleWebhookCapture } from './application/settle-webhook-capture.use-case';
import { BarberDayMoney } from './application/barber-day-money.use-case';
import { PrismaBarberDayMoneyRepository } from './infrastructure/prisma-barber-day-money.repository';
import { BarberCancelSettlement } from './application/barber-cancel-settlement.use-case';
import { ReconcileStuckRefunds } from './application/reconcile-stuck-refunds.use-case';
import { PrismaStuckRefunds } from './infrastructure/prisma-stuck-refunds';
import { RefundReconciliationWorker } from './infrastructure/refund-reconciliation.worker';
import { AdminBarberUnavailabilityController } from '../scheduling/infrastructure/admin-barber-unavailability.controller';
import { ProcessStripeWebhookHandler } from '../billing/application/process-stripe-webhook.use-case';
import { ClientSessionGuard } from '../identity/infrastructure/client-session.guard';
import { PrismaSessionRepository } from '../identity/infrastructure/prisma-session-repository';
import { PrismaAppointmentPaymentRepository } from './infrastructure/prisma-appointment-payment.repository';
import { PrismaBookingPaymentRepository } from './infrastructure/prisma-booking-payment.repository';
import {
  CheckboxPaymentReceiptGateway,
  InProcessExpenditureReceiptGateway,
  StripePaymentCaptureGateway,
} from './infrastructure/payment-gateways';

export const APPOINTMENT_PAYMENT_REPOSITORY = Symbol('APPOINTMENT_PAYMENT_REPOSITORY');
import { BOOKING_PAYMENT_REPOSITORY } from './payment.tokens';
export { BOOKING_PAYMENT_REPOSITORY };
export const PAYMENT_CAPTURE_GATEWAY = Symbol('PAYMENT_CAPTURE_GATEWAY');
export const PAYMENT_RECEIPT_GATEWAY = Symbol('PAYMENT_RECEIPT_GATEWAY');
export const REFUND_RECEIPT_GATEWAY = Symbol('REFUND_RECEIPT_GATEWAY');

/**
 * Payment flows (T-091 deposit, T-093 on-site, T-094 refund): the use cases keep
 * their existing ports; this module supplies Prisma-backed repositories and
 * acquiring/fiscal adapters, and exposes the deposit and on-site HTTP endpoints.
 */
@Module({
  imports: [SchedulingModule],
  controllers: [
    PaymentController,
    AdminPaymentsController,
    BarberPaymentsController,
    StripeWebhookController,
    // T-4616a: рішення по конфлікту недоступності + грошовий слід скасування
    // в одному модулі, бо refund належить платежам, а конфлікт — календарю.
    AdminBarberUnavailabilityController,
  ],
  providers: [
    PrismaService,
    PrismaAppointmentPaymentRepository,
    PrismaBookingPaymentRepository,
    PrismaSessionRepository,
    ClientSessionGuard,
    StripeAcquiringGateway,
    StripePaymentCaptureGateway,
    {
      provide: CheckboxFiscalGateway,
      useFactory: () =>
        new CheckboxFiscalGateway(
          process.env.CHECKBOX_API_URL ?? 'https://api.checkbox.ua/api/v1',
          process.env.CHECKBOX_MERCHANT_ID ?? '',
          process.env.CHECKBOX_SECRET_KEY ?? '',
          process.env.CHECKBOX_TEST_MODE !== 'false'
        ),
    },
    CheckboxPaymentReceiptGateway,
    InProcessExpenditureReceiptGateway,
    {
      provide: APPOINTMENT_PAYMENT_REPOSITORY,
      useExisting: PrismaAppointmentPaymentRepository,
    },
    { provide: BOOKING_PAYMENT_REPOSITORY, useExisting: PrismaBookingPaymentRepository },
    { provide: PAYMENT_CAPTURE_GATEWAY, useExisting: StripePaymentCaptureGateway },
    { provide: PAYMENT_RECEIPT_GATEWAY, useExisting: CheckboxPaymentReceiptGateway },
    { provide: REFUND_RECEIPT_GATEWAY, useExisting: InProcessExpenditureReceiptGateway },
    PrismaBillingPaymentRepository,
    PrismaBillingOutboxPublisher,
    PrismaBarberDayMoneyRepository,
    {
      provide: BarberCancelSettlement,
      useFactory: (
        bookings: PrismaBookingPaymentRepository,
        payments: PrismaAppointmentPaymentRepository,
        refunds: T094Refund,
        holds: DepositHoldService
      ) => new BarberCancelSettlement({ bookings, payments, refunds, holds }),
      inject: [
        BOOKING_PAYMENT_REPOSITORY,
        APPOINTMENT_PAYMENT_REPOSITORY,
        T094Refund,
        DepositHoldService,
      ],
    },
    {
      provide: BarberDayMoney,
      useFactory: (visits: PrismaBarberDayMoneyRepository) => new BarberDayMoney({ visits }),
      inject: [PrismaBarberDayMoneyRepository],
    },
    {
      provide: SettleWebhookCapture,
      useFactory: (
        payments: PrismaAppointmentPaymentRepository,
        bookings: PrismaBookingPaymentRepository,
        holds: DepositHoldService,
        refunds: T094Refund
      ) => new SettleWebhookCapture({ payments, bookings, holds, lateCaptureRefunds: refunds }),
      inject: [
        APPOINTMENT_PAYMENT_REPOSITORY,
        BOOKING_PAYMENT_REPOSITORY,
        DepositHoldService,
        T094Refund,
      ],
    },
    {
      provide: ProcessStripeWebhookHandler,
      useFactory: (
        payments: PrismaBillingPaymentRepository,
        outbox: PrismaBillingOutboxPublisher
      ) => new ProcessStripeWebhookHandler({ payments, outbox, clock: { now: () => new Date() } }),
      inject: [PrismaBillingPaymentRepository, PrismaBillingOutboxPublisher],
    },
    {
      provide: DepositFlow,
      useFactory: (
        payments: PrismaAppointmentPaymentRepository,
        bookings: PrismaBookingPaymentRepository,
        gateway: StripePaymentCaptureGateway,
        receipts: CheckboxPaymentReceiptGateway,
        holds: DepositHoldService,
        refunds: T094Refund
      ) =>
        new DepositFlow({
          payments,
          bookings,
          gateway,
          receipts,
          holds,
          lateCaptureRefunds: refunds,
        }),
      inject: [
        APPOINTMENT_PAYMENT_REPOSITORY,
        BOOKING_PAYMENT_REPOSITORY,
        PAYMENT_CAPTURE_GATEWAY,
        PAYMENT_RECEIPT_GATEWAY,
        DepositHoldService,
        T094Refund,
      ],
    },
    {
      provide: OnsitePayment,
      useFactory: (
        payments: PrismaAppointmentPaymentRepository,
        bookings: PrismaBookingPaymentRepository,
        gateway: StripePaymentCaptureGateway,
        receipts: CheckboxPaymentReceiptGateway
      ) => new OnsitePayment({ payments, bookings, gateway, receipts }),
      inject: [
        APPOINTMENT_PAYMENT_REPOSITORY,
        BOOKING_PAYMENT_REPOSITORY,
        PAYMENT_CAPTURE_GATEWAY,
        PAYMENT_RECEIPT_GATEWAY,
      ],
    },
    {
      provide: T094Refund,
      useFactory: (
        bookings: PrismaBookingPaymentRepository,
        receipts: InProcessExpenditureReceiptGateway,
        payments: PrismaAppointmentPaymentRepository,
        acquiring: StripeAcquiringGateway
      ) => new T094Refund(bookings, receipts, () => new Date(), payments, acquiring),
      inject: [
        BOOKING_PAYMENT_REPOSITORY,
        REFUND_RECEIPT_GATEWAY,
        APPOINTMENT_PAYMENT_REPOSITORY,
        StripeAcquiringGateway,
      ],
    },
    PrismaStuckRefunds,
    {
      provide: ReconcileStuckRefunds,
      useFactory: (stuck: PrismaStuckRefunds, refunds: T094Refund) =>
        new ReconcileStuckRefunds({ stuck, refunds, clock: { now: () => new Date() } }),
      inject: [PrismaStuckRefunds, T094Refund],
    },
    RefundReconciliationWorker,
  ],
  exports: [DepositFlow, OnsitePayment, T094Refund, ReconcileStuckRefunds],
})
export class PaymentModule {}
