/* eslint-disable max-lines, max-params -- cohesive module (159 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 1 signature whose 4-param contract is fixed by existing call sites (worst: an existing definition, limit 3); API redesign tracked in T-2500f */
// Специфікація T-093: решта = FinalPrice − депозит, форма готівка/POS,
// ідемпотентність повторного позначення і закриваючий чек ланцюга.
import { Booking } from '../../scheduling/domain/booking';
import { PaymentForm, PaymentStatus } from '../../billing/domain/payment-status.enum';
import {
  InMemoryAppointmentPaymentRepository,
  InMemoryBookingPaymentRepository,
  type DepositCaptureGateway,
  type DepositReceiptGateway,
} from './deposit-flow.use-case';
import { CheckboxReceiptType, type CheckboxReceipt } from './checkbox-fiscal-gateway';
import { OnsitePayment } from './onsite-payment.use-case';

const START = new Date('2026-12-01T12:00:00.000Z');

function booking(price = 500, withDeposit = true, depositPercent = 30): Booking {
  const item = Booking.create({
    barberId: 'barber-1',
    locationId: 'loc-1',
    clientId: 'client-1',
    start: START,
    end: new Date(START.getTime() + 30 * 60_000),
    agreedPrice: price,
    finalPrice: price,
    depositPolicy: { percent: depositPercent, rounding: 1, cancellationWindowHours: 4 },
  });
  if (withDeposit) item.depositStatus = 'captured';
  return item;
}

function gateway(result: boolean | Error = true): DepositCaptureGateway & {
  calls: Array<[string, number]>;
} {
  const calls: Array<[string, number]> = [];
  return {
    calls,
    async capture(paymentId: string, amount: number): Promise<boolean> {
      calls.push([paymentId, amount]);
      if (result instanceof Error) throw result;
      return result;
    },
  };
}

function receipts(): DepositReceiptGateway & {
  calls: Array<{ amount: number; type: CheckboxReceiptType; checkId?: string }>;
} {
  const calls: Array<{ amount: number; type: CheckboxReceiptType; checkId?: string }> = [];
  return {
    calls,
    async issueReceipt(bookingId, amount, type, checkId): Promise<CheckboxReceipt> {
      calls.push({ amount, type, ...(checkId ? { checkId } : {}) });
      return {
        check_id: checkId ?? `check_${bookingId}`,
        type,
        amount,
        status: 'signed',
        created_at: new Date(),
      };
    },
  };
}

function harness(options: { target?: Booking; capture?: boolean | Error } = {}) {
  const target = options.target ?? booking();
  const capture = gateway(options.capture ?? true);
  const fiscal = receipts();
  const payments = new InMemoryAppointmentPaymentRepository();
  const events: Array<{ type: string; data: Record<string, unknown> }> = [];
  const payment = new OnsitePayment({
    payments,
    bookings: new InMemoryBookingPaymentRepository([target]),
    gateway: capture,
    receipts: fiscal,
    events: { publish: async (event) => void events.push(event) },
    clock: { now: () => START },
  });
  return { payment, target, capture, fiscal, payments, events };
}

describe('OnsitePayment (T-093)', () => {
  it('charges the remainder after the deposit and closes the receipt chain', async () => {
    const h = harness();

    const result = await h.payment.execute({
      bookingId: h.target.id,
      form: PaymentForm.CASH,
      by: 'barber-1',
    });

    expect(result.outcome).toBe('captured');
    expect(result.depositAmount).toBe(150);
    expect(result.paidAmount).toBe(350);
    expect(result.payment?.status).toBe(PaymentStatus.PAID);
    expect(h.capture.calls).toEqual([[result.payment?.id, 350]]);
    expect(h.fiscal.calls).toEqual([
      { amount: 350, type: CheckboxReceiptType.Remainder, checkId: `remainder_${h.target.id}` },
    ]);
    expect(h.target.paymentMethod).toBe(PaymentForm.CASH);
    expect(result.audit).toMatchObject({ by: 'barber-1', form: PaymentForm.CASH, amount: 350 });
    expect(h.events).toHaveLength(1);
  });

  it('issues a full-sale receipt when no deposit was taken', async () => {
    const h = harness({ target: booking(500, false) });

    const result = await h.payment.execute({
      bookingId: h.target.id,
      form: PaymentForm.POS,
      by: 'admin-1',
    });

    expect(result.depositAmount).toBe(0);
    expect(result.paidAmount).toBe(500);
    expect(h.fiscal.calls).toEqual([
      { amount: 500, type: CheckboxReceiptType.FullPayment, checkId: `full_${h.target.id}` },
    ]);
  });

  it('is idempotent when the visit is marked paid twice', async () => {
    const h = harness();

    const first = await h.payment.execute({
      bookingId: h.target.id,
      form: PaymentForm.CASH,
      by: 'barber-1',
    });
    const second = await h.payment.execute({
      bookingId: h.target.id,
      form: PaymentForm.CASH,
      by: 'barber-1',
    });

    expect(second.outcome).toBe('already_paid');
    expect(second.payment?.id).toBe(first.payment?.id);
    expect(h.capture.calls).toHaveLength(1);
    expect(h.fiscal.calls).toHaveLength(1);
  });

  it('does nothing when the deposit already covers the price', async () => {
    const h = harness({ target: booking(500, true, 100) });

    const result = await h.payment.execute({
      bookingId: h.target.id,
      form: PaymentForm.CASH,
      by: 'barber-1',
    });

    expect(result.outcome).toBe('nothing_due');
    expect(result.paidAmount).toBe(0);
    expect(h.capture.calls).toHaveLength(0);
    expect(h.fiscal.calls).toHaveLength(0);
  });

  it('keeps the payment cancelled and does not issue a receipt when the acquirer fails', async () => {
    const h = harness({ capture: new Error('POS offline') });

    const result = await h.payment.execute({
      bookingId: h.target.id,
      form: PaymentForm.POS,
      by: 'admin-1',
    });

    expect(result.outcome).toBe('failed');
    expect(result.payment?.status).toBe(PaymentStatus.CANCELLED);
    expect(result.paidAmount).toBe(0);
    expect(result.failureReason).toContain('POS offline');
    expect(h.fiscal.calls).toHaveLength(0);
  });

  it('never charges a complimentary visit', async () => {
    const free = booking(0, false);
    const h = harness({ target: free });

    const result = await h.payment.execute({
      bookingId: free.id,
      form: PaymentForm.CASH,
      by: 'barber-1',
    });

    expect(result.outcome).toBe('complimentary');
    expect(h.capture.calls).toHaveLength(0);
  });
});
