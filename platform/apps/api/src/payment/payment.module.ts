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
import { PrismaAppointmentPaymentRepository } from './infrastructure/prisma-appointment-payment.repository';
import { PrismaBookingPaymentRepository } from './infrastructure/prisma-booking-payment.repository';
import {
  CheckboxPaymentReceiptGateway,
  InProcessExpenditureReceiptGateway,
  StripePaymentCaptureGateway,
} from './infrastructure/payment-gateways';

export const APPOINTMENT_PAYMENT_REPOSITORY = Symbol('APPOINTMENT_PAYMENT_REPOSITORY');
export const BOOKING_PAYMENT_REPOSITORY = Symbol('BOOKING_PAYMENT_REPOSITORY');
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
  controllers: [PaymentController],
  providers: [
    PrismaService,
    PrismaAppointmentPaymentRepository,
    PrismaBookingPaymentRepository,
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
    {
      provide: DepositFlow,
      useFactory: (
        payments: PrismaAppointmentPaymentRepository,
        bookings: PrismaBookingPaymentRepository,
        gateway: StripePaymentCaptureGateway,
        receipts: CheckboxPaymentReceiptGateway,
        holds: DepositHoldService
      ) => new DepositFlow({ payments, bookings, gateway, receipts, holds }),
      inject: [
        APPOINTMENT_PAYMENT_REPOSITORY,
        BOOKING_PAYMENT_REPOSITORY,
        PAYMENT_CAPTURE_GATEWAY,
        PAYMENT_RECEIPT_GATEWAY,
        DepositHoldService,
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
  ],
  exports: [DepositFlow, OnsitePayment, T094Refund],
})
export class PaymentModule {}
