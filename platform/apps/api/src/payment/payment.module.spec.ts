import { Test } from '@nestjs/testing';
import { Booking } from '../scheduling/domain/booking';
import { PaymentForm } from '../billing/domain/payment-status.enum';
import { DepositHoldService } from '../scheduling/application/deposit-hold.service';
import { CheckboxReceiptType } from './application/checkbox-fiscal-gateway';
import {
  DepositFlow,
  InMemoryAppointmentPaymentRepository,
  InMemoryBookingPaymentRepository,
} from './application/deposit-flow.use-case';
import { PaymentController } from './payment.controller';
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
      .useValue({ issueRefundReceipt: async (input: { refundId: string }) => ({ receiptId: `r_${input.refundId}`, status: 'done' as const }) })
      .overrideProvider(DepositHoldService)
      .useValue({
        status: async () => 'active',
        capture: async () => ({ outcome: 'captured' }),
      })
      .compile();

    controller = moduleRef.get(PaymentController);
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

  it('marks the remaining balance as an on-site cash payment', async () => {
    await controller.collectDeposit(booking().id);
    const result = await controller.payOnsite({
      bookingId: booking().id,
      form: PaymentForm.CASH,
      by: 'manager-1',
    });

    expect(result.outcome).toBe('captured');
    expect(result.paidAmount).toBe(700);
    expect(result.audit).toMatchObject({ by: 'manager-1', amount: 700 });
    expect((await payments.findByAppointmentId(booking().id)).map((p) => p.amount)).toEqual([
      300, 700,
    ]);
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
      })
      .compile();

    expect(moduleRef.get(DepositFlow)).toBeInstanceOf(DepositFlow);
  });
});
