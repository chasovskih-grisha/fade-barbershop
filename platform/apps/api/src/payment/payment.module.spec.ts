/* eslint-disable max-lines -- wiring tests share the payment fixture and fake gateways; split tracked in T-2500f */
import { Test } from '@nestjs/testing';
import { Booking } from '../scheduling/domain/booking';
import { PaymentForm, PaymentStatus } from '../billing/domain/payment-status.enum';
import { DepositHoldService } from '../scheduling/application/deposit-hold.service';
import { CheckboxReceiptType } from './application/checkbox-fiscal-gateway';
import {
  DepositFlow,
  InMemoryAppointmentPaymentRepository,
  InMemoryBookingPaymentRepository,
} from './application/deposit-flow.use-case';
import { PaymentController } from './payment.controller';
import type { Request } from 'express';
import { SESSION_COOKIE_NAME } from '../identity/infrastructure/session-cookie';
import { PrismaService } from '../shared/prisma/prisma.service';
import { AdminPaymentsController } from './infrastructure/admin-payments.controller';
import { StripeWebhookController } from './infrastructure/stripe-webhook.controller';
import { SettleWebhookCapture } from './application/settle-webhook-capture.use-case';
import { ProcessStripeWebhookHandler } from '../billing/application/process-stripe-webhook.use-case';
import {
  APPOINTMENT_PAYMENT_REPOSITORY,
  BOOKING_PAYMENT_REPOSITORY,
  PAYMENT_CAPTURE_GATEWAY,
  PAYMENT_RECEIPT_GATEWAY,
  PaymentModule,
  REFUND_RECEIPT_GATEWAY,
} from './payment.module';

const START = new Date('2026-12-01T10:00:00Z');

function booking(): Booking {
  return Booking.reconstitute({
    id: '11111111-1111-4111-8111-111111111111',
    barberId: '22222222-2222-4222-8222-222222222222',
    locationId: '33333333-3333-4333-8333-333333333333',
    clientId: '44444444-4444-4444-8444-444444444444',
    start: START,
    end: new Date(START.getTime() + 60 * 60_000),
    version: 0,
    finalPrice: 1_000,
    requiresPayment: true,
    status: 'pending',
    deposit: { amount: 300, percent: 30, rounding: 10, cancellationWindowHours: 4 },
  });
}

describe('PaymentModule wiring (T-091/T-093)', () => {
  let controller: PaymentController;
  let admin: AdminPaymentsController;
  let payments: InMemoryAppointmentPaymentRepository;
  let bookings: InMemoryBookingPaymentRepository;

  beforeEach(async () => {
    payments = new InMemoryAppointmentPaymentRepository();
    bookings = new InMemoryBookingPaymentRepository([booking()]);
    const moduleRef = await Test.createTestingModule({ imports: [PaymentModule] })
      .overrideProvider(APPOINTMENT_PAYMENT_REPOSITORY)
      .useValue(payments)
      .overrideProvider(BOOKING_PAYMENT_REPOSITORY)
      .useValue(bookings)
      .overrideProvider(PAYMENT_CAPTURE_GATEWAY)
      .useValue({ capture: async () => true })
      .overrideProvider(PAYMENT_RECEIPT_GATEWAY)
      .useValue({
        issueReceipt: async (_bookingId: string, amount: number, type: CheckboxReceiptType) => ({
          check_id: `check_${type}`,
          type,
          amount,
          status: 'signed' as const,
          created_at: new Date(),
        }),
      })
      .overrideProvider(REFUND_RECEIPT_GATEWAY)
      .useValue({
        issueRefundReceipt: async (input: { refundId: string }) => ({
          receiptId: `r_${input.refundId}`,
          status: 'done' as const,
        }),
      })
      .overrideProvider(DepositHoldService)
      .useValue({
        find: async () => ({
          appointmentId: booking().id,
          status: 'active',
          depositAmount: 300,
          expiresAt: new Date(Date.now() + 600_000),
        }),
        status: async () => 'active',
        capture: async () => ({ outcome: 'captured' }),
        release: async () => true,
      })
      .overrideProvider(PrismaService)
      .useValue({
        session: {
          findUnique: async () => ({
            userId: booking().clientId,
            channel: 'web',
            revokedAt: null,
            accessExpiresAt: null,
          }),
        },
      })
      .compile();

    controller = moduleRef.get(PaymentController);
    admin = moduleRef.get(AdminPaymentsController);
  });

  it('collects a deposit through the wired module and persists the payment', async () => {
    const result = await controller.collectDeposit(booking().id);
    expect(result.outcome).toBe('captured');
    expect(result.depositAmount).toBe(300);
    expect(result.requiresBalance).toBe(true);
    expect(result.receiptId).toBe('check_deposit');

    const stored = await payments.findByAppointmentId(booking().id);
    expect(stored).toHaveLength(1);
    expect(stored[0]?.amount).toBe(300);
    expect((await bookings.findById(booking().id))?.depositStatus).toBe('captured');
  });

  it('refunds a deposit captured after the hold was lost', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [PaymentModule] })
      .overrideProvider(APPOINTMENT_PAYMENT_REPOSITORY)
      .useValue(payments)
      .overrideProvider(BOOKING_PAYMENT_REPOSITORY)
      .useValue(bookings)
      .overrideProvider(PAYMENT_CAPTURE_GATEWAY)
      .useValue({ capture: async () => true })
      .overrideProvider(PAYMENT_RECEIPT_GATEWAY)
      .useValue({ issueReceipt: async () => undefined })
      .overrideProvider(REFUND_RECEIPT_GATEWAY)
      .useValue({ issueRefundReceipt: async () => ({ receiptId: 'r1', status: 'done' as const }) })
      .overrideProvider(DepositHoldService)
      .useValue({
        status: async () => 'active',
        capture: async () => ({ outcome: 'expired' }),
        release: async () => true,
      })
      .compile();

    const result = await moduleRef.get(PaymentController).collectDeposit(booking().id);

    expect(result.outcome).toBe('expired');
    expect(result.refund).toMatchObject({ status: 'completed' });
    const stored = await payments.findByAppointmentId(booking().id);
    expect(stored[0]?.status).toBe(PaymentStatus.REFUNDED);
  });

  it('reports a live hold so the cabinet can resume payment', async () => {
    const status = await controller.depositStatus(booking().id, {
      cookies: { [SESSION_COOKIE_NAME]: 'client-session' },
      headers: {},
    } as unknown as Request);

    expect(status).toMatchObject({ status: 'payable', amount: 300 });
    if (status.status !== 'payable') throw new Error('payable expected');
    expect(new Date(status.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('marks the remaining balance as an on-site cash payment', async () => {
    await controller.collectDeposit(booking().id);
    const result = await controller.payOnsite(
      { bookingId: booking().id, form: PaymentForm.CASH },
      { adminUserId: 'manager-1' }
    );

    expect(result.outcome).toBe('captured');
    expect(result.paidAmount).toBe(700);
    expect(result.audit).toMatchObject({ by: 'manager-1', amount: 700 });
    expect((await payments.findByAppointmentId(booking().id)).map((p) => p.amount)).toEqual([
      300, 700,
    ]);
  });

  it('takes the on-site actor from the admin session and reports the remainder', async () => {
    await controller.collectDeposit(booking().id);
    const request = { adminUserId: 'admin-9' } as never;

    const status = await admin.status(booking().id);
    expect(status).toMatchObject({ amountDue: 700, outstanding: 700, paymentStatus: 'unpaid' });

    const result = await admin.pay({ bookingId: booking().id, form: PaymentForm.CASH }, request);
    expect(result.outcome).toBe('captured');
    expect(result.audit).toMatchObject({ by: 'admin-9', amount: 700 });

    const paid = await admin.status(booking().id);
    expect(paid).toMatchObject({ outstanding: 0, paymentStatus: 'paid' });
  });

  it('resolves the use cases through the module container', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [PaymentModule] })
      .overrideProvider(APPOINTMENT_PAYMENT_REPOSITORY)
      .useValue(payments)
      .overrideProvider(BOOKING_PAYMENT_REPOSITORY)
      .useValue(bookings)
      .overrideProvider(PAYMENT_CAPTURE_GATEWAY)
      .useValue({ capture: async () => true })
      .overrideProvider(PAYMENT_RECEIPT_GATEWAY)
      .useValue({ issueReceipt: async () => undefined })
      .overrideProvider(REFUND_RECEIPT_GATEWAY)
      .useValue({ issueRefundReceipt: async () => ({ receiptId: 'r1', status: 'done' as const }) })
      .overrideProvider(DepositHoldService)
      .useValue({
        status: async () => 'active',
        capture: async () => ({ outcome: 'captured' }),
        release: async () => true,
      })
      .compile();

    expect(moduleRef.get(DepositFlow)).toBeInstanceOf(DepositFlow);
  });

  it('exposes the acquiring webhook route and its settlement through the container', () => {
    const moduleRef = Test.createTestingModule({ imports: [PaymentModule] });
    return moduleRef.compile().then((compiled) => {
      expect(compiled.get(StripeWebhookController)).toBeInstanceOf(StripeWebhookController);
      expect(compiled.get(SettleWebhookCapture)).toBeInstanceOf(SettleWebhookCapture);
      expect(compiled.get(ProcessStripeWebhookHandler)).toBeInstanceOf(ProcessStripeWebhookHandler);
    });
  });
});
