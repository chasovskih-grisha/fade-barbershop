/* eslint-disable max-lines, max-params -- cohesive module (176 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 1 signature whose 4-param contract is fixed by existing call sites (worst: an existing definition, limit 3); API redesign tracked in T-2500f */
// Специфікація T-091: депозит 30% зі снепшота візиту, ідемпотентність,
// безоплатний візит без платежу й чека (PAY-003) і «гроші не списані» на
// помилці еквайрингу (PAY-WEB-05/06).
import { Booking } from '../../scheduling/domain/booking';
import type { DepositPolicy } from '../../scheduling/domain/deposit-terms';
import { PaymentStatus } from '../../billing/domain/payment-status.enum';
import {
  DepositFlow,
  InMemoryAppointmentPaymentRepository,
  InMemoryBookingPaymentRepository,
  type BookingPaymentPort,
  type DepositCaptureGateway,
  type DepositReceiptGateway,
} from './deposit-flow.use-case';
import { CheckboxReceiptType, type CheckboxReceipt } from './checkbox-fiscal-gateway';

const START = new Date('2026-12-01T10:00:00.000Z');

function booking(
  overrides: {
    finalPrice?: number;
    requiresPayment?: boolean;
    depositPolicy?: DepositPolicy;
  } = {}
): Booking {
  const price = overrides.finalPrice ?? 500;
  return Booking.create({
    barberId: 'barber-1',
    locationId: 'loc-1',
    clientId: 'client-1',
    start: START,
    end: new Date(START.getTime() + 30 * 60_000),
    agreedPrice: price,
    finalPrice: price,
    requiresPayment: overrides.requiresPayment ?? true,
    ...(overrides.depositPolicy ? { depositPolicy: overrides.depositPolicy } : {}),
  });
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
  calls: Array<{ amount: number; type: CheckboxReceiptType }>;
} {
  const calls: Array<{ amount: number; type: CheckboxReceiptType }> = [];
  return {
    calls,
    async issueReceipt(bookingId, amount, type, checkId): Promise<CheckboxReceipt> {
      calls.push({ amount, type });
      return {
        check_id: checkId ?? `check_${bookingId}`,
        type,
        amount,
        status: 'signed',
        created_at: new Date(),
        signed_at: new Date(),
      };
    },
  };
}

function harness(options: { entitle?: Booking; capture?: boolean | Error } = {}): {
  flow: DepositFlow;
  bookings: InMemoryBookingPaymentRepository;
  payments: InMemoryAppointmentPaymentRepository;
  capture: ReturnType<typeof gateway>;
  fiscal: ReturnType<typeof receipts>;
  events: Array<{ type: string; data: Record<string, unknown> }>;
} {
  const stored = options.entitle ?? booking();
  const bookings = new InMemoryBookingPaymentRepository([stored]);
  const payments = new InMemoryAppointmentPaymentRepository();
  const capture = gateway(options.capture ?? true);
  const fiscal = receipts();
  const events: Array<{ type: string; data: Record<string, unknown> }> = [];
  const flow = new DepositFlow({
    payments,
    bookings,
    gateway: capture,
    receipts: fiscal,
    events: { publish: async (event) => void events.push(event) },
    clock: { now: () => START },
  });
  return { flow, bookings, payments, capture, fiscal, events };
}

describe('DepositFlow (T-091)', () => {
  it('captures 30% of the snapshot price and confirms the booking', async () => {
    const target = booking();
    const h = harness({ entitle: target });

    const result = await h.flow.execute(target.id);

    expect(result.outcome).toBe('captured');
    expect(result.depositAmount).toBe(150);
    expect(result.payment?.status).toBe(PaymentStatus.DEPOSIT_PAID);
    expect(h.capture.calls).toEqual([[result.payment?.id, 150]]);
    expect(h.fiscal.calls).toEqual([{ amount: 150, type: CheckboxReceiptType.Deposit }]);
    expect(target.depositStatus).toBe('captured');
    expect(target.status).toBe('confirmed');
    expect(result.requiresBalance).toBe(true);
    expect(h.events.map((event) => event.type)).toEqual([
      'scheduling.appointment.payment_captured',
    ]);
  });

  it('never charges a complimentary visit and never calls the fiscal gateway (PAY-003)', async () => {
    const free = booking({ finalPrice: 0, requiresPayment: false });
    const { flow, capture, fiscal, payments } = harness({ entitle: free });

    const result = await flow.execute(free.id);

    expect(result.outcome).toBe('complimentary');
    expect(result.depositAmount).toBe(0);
    expect(result.requiresBalance).toBe(false);
    expect(free.depositStatus).toBe('exempt');
    expect(capture.calls).toHaveLength(0);
    expect(fiscal.calls).toHaveLength(0);
    expect(await payments.findByAppointmentId(free.id)).toHaveLength(0);
  });

  it('is idempotent on a second click (PAY-WEB-03)', async () => {
    const target = booking();
    const { flow, capture, fiscal } = harness({ entitle: target });

    const first = await flow.execute(target.id);
    const second = await flow.execute(target.id);

    expect(second.outcome).toBe('already_paid');
    expect(second.payment?.id).toBe(first.payment?.id);
    expect(second.depositAmount).toBe(150);
    expect(capture.calls).toHaveLength(1);
    expect(fiscal.calls).toHaveLength(1);
  });

  it('keeps the booking unconfirmed and reports no charge when the acquirer declines', async () => {
    const target = booking();
    const { flow, fiscal, events } = harness({ entitle: target, capture: false });

    const result = await flow.execute(target.id);

    expect(result.outcome).toBe('failed');
    expect(result.depositAmount).toBe(0);
    expect(result.payment?.status).toBe(PaymentStatus.CANCELLED);
    expect(result.requiresBalance).toBe(true);
    expect(result.failureReason).toContain('declined');
    expect(target.depositStatus).toBe('failed');
    expect(fiscal.calls).toHaveLength(0);
    expect(events).toHaveLength(0);
  });

  it('treats an acquirer exception as a charge failure and never issues a receipt', async () => {
    const target = booking();
    const { flow, fiscal } = harness({ entitle: target, capture: new Error('timeout') });

    const result = await flow.execute(target.id);

    expect(result.outcome).toBe('failed');
    expect(result.failureReason).toContain('timeout');
    expect(result.payment?.status).toBe(PaymentStatus.CANCELLED);
    expect(fiscal.calls).toHaveLength(0);
  });

  it('does not invent a deposit when the snapshot disabled it', async () => {
    const withoutDeposit = booking({
      depositPolicy: { percent: 0, rounding: 10, cancellationWindowHours: 4 },
    });
    const { flow, capture } = harness({ entitle: withoutDeposit });

    const result = await flow.execute(withoutDeposit.id);

    expect(withoutDeposit.deposit).toBeNull();
    expect(result.outcome).toBe('no_deposit');
    expect(result.depositAmount).toBe(0);
    expect(capture.calls).toHaveLength(0);
    expect(withoutDeposit.depositStatus).toBe('exempt');
  });

  it('rejects an unknown booking', async () => {
    const { flow } = harness();

    await expect(flow.execute('missing')).rejects.toThrow('not found');
  });
});

describe('InMemoryBookingPaymentRepository', () => {
  it('saves and reloads the same aggregate', async () => {
    const target = booking();
    const port: BookingPaymentPort = new InMemoryBookingPaymentRepository([target]);

    expect((await port.findById(target.id))?.id).toBe(target.id);
    await expect(port.findById('missing')).resolves.toBeNull();
  });
});
