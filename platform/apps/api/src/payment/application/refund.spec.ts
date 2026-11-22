/* eslint-disable max-lines -- cohesive module (163 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// Специфікація T-094: автоматичний refund у межах вікна скасування,
// команда адміна поза вікном (no-show), ідемпотентність першого коміту,
// видатковий чек, `failed` і повтори (PAY-005…010).
import { Booking } from '../../scheduling/domain/booking';
import type { AcquiringGateway } from '../../billing/domain/acquiring.gateway.interface';
import { Payment } from '../../billing/domain/payment.entity';
import { PaymentForm, PaymentStatus } from '../../billing/domain/payment-status.enum';
import { RefundReason, RefundStatus } from '../domain/refund.entity';
import {
  MAX_REFUND_RETRIES,
  T094Refund,
  canRefundCancellation,
  type ExpenditureReceiptGateway,
  type RefundBookingPort,
} from './refund.use-case';
import { InMemoryAppointmentPaymentRepository } from './deposit-flow.use-case';

const HOUR_MS = 3_600_000;

function startIn(hours: number): Date {
  return new Date(Date.now() + hours * HOUR_MS);
}

function booking(hoursUntilStart = 24, price = 500): Booking {
  const start = startIn(hoursUntilStart);
  const item = Booking.create({
    barberId: 'barber-1',
    locationId: 'loc-1',
    clientId: 'client-1',
    start,
    end: new Date(start.getTime() + 30 * 60_000),
    agreedPrice: price,
    finalPrice: price,
  });
  item.depositStatus = 'captured';
  return item;
}

class MemoryBookingRepository implements RefundBookingPort {
  private readonly items = new Map<string, Booking>();

  constructor(seed: Booking[] = []) {
    seed.forEach((item) => this.items.set(item.id, item));
  }

  async findById(id: string): Promise<Booking | null> {
    return this.items.get(id) ?? null;
  }

  async findByRefundId(refundId: string): Promise<Booking | null> {
    return [...this.items.values()].find((item) => item.refundId === refundId) ?? null;
  }

  async save(item: Booking): Promise<void> {
    this.items.set(item.id, item);
  }
}

function gateway(outcomes: Array<'done' | 'failed'> = ['done']): ExpenditureReceiptGateway & {
  calls: Array<{ amount: number; refundId: string }>;
} {
  const calls: Array<{ amount: number; refundId: string }> = [];
  let index = 0;
  return {
    calls,
    async issueRefundReceipt(input) {
      calls.push({ amount: input.amount, refundId: input.refundId });
      const outcome = outcomes[Math.min(index, outcomes.length - 1)] ?? 'done';
      index += 1;
      return outcome === 'done'
        ? { receiptId: `expenditure_${input.refundId}`, status: 'done' as const }
        : { receiptId: '', status: 'failed' as const, error: 'acquiring unavailable' };
    },
  };
}

function harness(options: { target?: Booking; outcomes?: Array<'done' | 'failed'> } = {}) {
  const target = options.target ?? booking();
  const repo = new MemoryBookingRepository([target]);
  const fiscal = gateway(options.outcomes);
  return { refund: new T094Refund(repo, fiscal), repo, fiscal, target };
}

function payment(input: {
  appointmentId: string;
  id: string;
  amount: number;
  status: PaymentStatus;
  receiptId?: string;
}): Payment {
  return new Payment({
    id: input.id,
    appointmentId: input.appointmentId,
    clientId: 'client-1',
    amount: input.amount,
    form: PaymentForm.CARD,
    status: input.status,
    traceId: input.id,
    ...(input.receiptId ? { receiptId: input.receiptId } : {}),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function acquiring(outcomes: Array<'ok' | 'error'> = ['ok']) {
  const calls: Array<{ providerSessionId: string; amount: number; idempotencyKey?: string }> = [];
  let index = 0;
  const gateway: Pick<AcquiringGateway, 'refundPayment'> = {
    async refundPayment(params) {
      calls.push({
        providerSessionId: params.providerSessionId,
        amount: params.amount,
        ...(params.idempotencyKey ? { idempotencyKey: params.idempotencyKey } : {}),
      });
      const outcome = outcomes[Math.min(index, outcomes.length - 1)] ?? 'ok';
      index += 1;
      if (outcome === 'error') throw new Error('provider timeout');
      return { refundId: `re_${params.idempotencyKey ?? index}`, refundedAmount: params.amount };
    },
  };
  return { gateway, calls };
}

function acquiringHarness(options: {
  target?: Booking;
  payments: Payment[];
  provider?: Array<'ok' | 'error'>;
  receipt?: Array<'done' | 'failed'>;
}) {
  const target = options.target ?? booking();
  const repo = new MemoryBookingRepository([target]);
  const fiscal = gateway(options.receipt);
  const payments = new InMemoryAppointmentPaymentRepository();
  for (const item of options.payments) void payments.save(item);
  const provider = acquiring(options.provider);
  return {
    refund: new T094Refund(repo, fiscal, undefined, payments, provider.gateway),
    repo,
    fiscal,
    payments,
    provider,
    target,
  };
}

describe('canRefundCancellation (PAY-004)', () => {
  it('allows a cancellation inside the snapshot window and rejects a late one', () => {
    expect(canRefundCancellation(booking(24))).toBe(true);
    expect(canRefundCancellation(booking(1))).toBe(false);
  });
});

describe('T094Refund (T-094)', () => {
  it('refunds the captured deposit in full with an expenditure receipt', async () => {
    const h = harness();

    const { refund, isDuplicate } = await h.refund.initiateRefund(
      h.target.id,
      undefined,
      'PAY-004'
    );

    expect(isDuplicate).toBe(false);
    expect(refund.status).toBe(RefundStatus.COMPLETED);
    expect(refund.amount).toBe(150);
    expect(refund.reason).toBe(RefundReason.CANCELLATION);
    expect(refund.reasonCode).toBe('PAY-004');
    expect(refund.completedAt).toBeInstanceOf(Date);
    expect(h.fiscal.calls).toHaveLength(1);
    expect(h.target.refundStatus).toBe(RefundStatus.COMPLETED);
    expect(h.target.capturedRefundAmount).toBe(150);
  });

  it('refunds deposit and remainder for a completed visit', async () => {
    const target = booking(24);
    target.status = 'completed';
    const h = harness({ target });

    const { refund } = await h.refund.initiateRefund(target.id);

    expect(h.refund.capturedAmount(target)).toBe(500);
    expect(refund.amount).toBe(500);
  });

  it('rejects a request above the captured amount before any provider call (PAY-010)', async () => {
    const h = harness();

    await expect(h.refund.initiateRefund(h.target.id, 1_000)).rejects.toThrow(
      'exceeds available captured amount'
    );
    expect(h.fiscal.calls).toHaveLength(0);
    expect(h.refund.validateRefundAmount(150, 0)).toBe(0);
    expect(h.refund.validateRefundAmount(150, 80)).toBe(80);
  });

  it('records a true partial refund without inflating it to the captured total', async () => {
    const h = harness();

    const { refund } = await h.refund.initiateRefund(h.target.id, 80, 'PAY-004');

    expect(refund.amount).toBe(80);
    expect(refund.status).toBe(RefundStatus.COMPLETED);
    expect(h.target.capturedRefundAmount).toBe(80);
    expect(h.fiscal.calls).toEqual([{ amount: 80, refundId: refund.refundId }]);
  });

  it('refuses a cancellation after the free window and keeps the deposit', async () => {
    const h = harness({ target: booking(1) });

    await expect(h.refund.initiateRefund(h.target.id, undefined, 'PAY-004')).rejects.toThrow(
      'free cancellation window'
    );
    expect(h.fiscal.calls).toHaveLength(0);
    expect(h.target.refundStatus).toBeNull();
  });

  it('rejects an unknown reason code instead of bypassing the cancellation window', async () => {
    const h = harness({ target: booking(1) });

    await expect(h.refund.initiateRefund(h.target.id, undefined, 'NOT-A-CODE')).rejects.toThrow(
      'Unknown refund reason code'
    );
    expect(h.fiscal.calls).toHaveLength(0);
    expect(h.target.refundId).toBeNull();
  });

  it('rejects a zero or negative requested amount', async () => {
    const h = harness();

    await expect(h.refund.initiateRefund(h.target.id, 0)).rejects.toThrow(
      'Invalid refund amount'
    );
    await expect(h.refund.initiateRefund(h.target.id, -1)).rejects.toThrow(
      'Invalid refund amount'
    );
    expect(h.fiscal.calls).toHaveLength(0);
  });

  it('lets an admin refund a no-show outside the cancellation window (PAY-005b)', async () => {
    const h = harness({ target: booking(1) });

    const { refund } = await h.refund.initiateRefund(h.target.id, undefined, 'NSH-ADM-04');

    expect(refund.reason).toBe(RefundReason.NO_SHOW);
    expect(refund.status).toBe(RefundStatus.COMPLETED);
  });

  it('is idempotent: the first commit wins and the acquirer is charged once (PAY-008)', async () => {
    const h = harness();

    const first = await h.refund.initiateRefund(h.target.id, undefined, 'PAY-004', 'refund-1');
    const second = await h.refund.initiateRefund(h.target.id, undefined, 'PAY-004', 'refund-1');

    expect(second.isDuplicate).toBe(true);
    expect(second.refund.refundId).toBe(first.refund.refundId);
    expect(h.fiscal.calls).toHaveLength(1);
  });

  it('marks the refund failed and retries it up to the configured limit (PAY-009)', async () => {
    const h = harness({ outcomes: ['failed', 'done'] });

    const { refund } = await h.refund.initiateRefund(h.target.id, undefined, 'PAY-004');

    expect(refund.status).toBe(RefundStatus.FAILED);
    expect(refund.adminNote).toContain('acquiring unavailable');

    const retried = await h.refund.retryRefund(refund.refundId);

    expect(retried.status).toBe(RefundStatus.COMPLETED);
    expect(h.fiscal.calls).toHaveLength(2);

    await expect(h.refund.retryRefund(refund.refundId)).rejects.toThrow('not in failed status');
  });

  it('stops retrying after the maximum number of attempts', async () => {
    const h = harness({ outcomes: ['failed'] });

    const { refund } = await h.refund.initiateRefund(h.target.id);
    for (let attempt = 0; attempt < MAX_REFUND_RETRIES; attempt += 1) {
      await h.refund.retryRefund(refund.refundId);
    }

    await expect(h.refund.retryRefund(refund.refundId)).rejects.toThrow('Maximum refund retry');
  });

  it('refuses to refund when nothing was captured', async () => {
    const target = booking(24);
    target.depositStatus = null;
    const h = harness({ target });

    await expect(h.refund.initiateRefund(target.id)).rejects.toThrow(
      'No captured payment to refund'
    );
  });

  it('reports the refund status by refund id', async () => {
    const h = harness();

    const { refund } = await h.refund.initiateRefund(h.target.id, undefined, 'PAY-004', 'refund-9');

    const stored = await h.refund.refundStatus('refund-9');
    expect(stored?.refundId).toBe('refund-9');
    expect(stored?.status).toBe(RefundStatus.COMPLETED);
    expect(stored?.paymentMethod).toBe('walk-in');
    await expect(h.refund.refundStatus('missing')).resolves.toBeNull();
    void refund;
  });
});

describe('T094Refund acquiring (PAY-009)', () => {
  it('refunds the full captured amount across payments only after provider confirmation', async () => {
    const target = booking(24);
    target.status = 'completed';
    const h = acquiringHarness({
      target,
      payments: [
        payment({ appointmentId: target.id, id: 'pay-dep', amount: 150, status: PaymentStatus.DEPOSIT_PAID }),
        payment({ appointmentId: target.id, id: 'pay-rem', amount: 350, status: PaymentStatus.PAID }),
      ],
    });

    const { refund } = await h.refund.initiateRefund(target.id, undefined, 'PAY-004', 'refund-1');

    expect(h.provider.calls).toEqual([
      { providerSessionId: 'pay-dep', amount: 150, idempotencyKey: 'refund-1:pay-dep' },
      { providerSessionId: 'pay-rem', amount: 350, idempotencyKey: 'refund-1:pay-rem' },
    ]);
    expect(refund.status).toBe(RefundStatus.COMPLETED);
    expect(refund.amount).toBe(500);
    const stored = await h.payments.findByAppointmentId(target.id);
    expect(stored.map((item) => [item.status, item.refundedAmount])).toEqual([
      [PaymentStatus.REFUNDED, 150],
      [PaymentStatus.REFUNDED, 350],
    ]);
    expect(h.fiscal.calls).toHaveLength(1);
  });

  it('keeps a partial refund below the captured amount valid and partially refunds the payment', async () => {
    const target = booking(24);
    const h = acquiringHarness({
      target,
      payments: [
        payment({ appointmentId: target.id, id: 'pay-dep', amount: 150, status: PaymentStatus.DEPOSIT_PAID }),
      ],
    });

    const { refund } = await h.refund.initiateRefund(target.id, 80, 'PAY-004', 'refund-part');

    expect(h.provider.calls).toEqual([
      { providerSessionId: 'pay-dep', amount: 80, idempotencyKey: 'refund-part:pay-dep' },
    ]);
    expect(refund.amount).toBe(80);
    expect(refund.status).toBe(RefundStatus.COMPLETED);
    const [stored] = await h.payments.findByAppointmentId(target.id);
    expect(stored?.status).toBe(PaymentStatus.PARTIALLY_REFUNDED);
    expect(stored?.refundedAmount).toBe(80);
    expect(h.fiscal.calls).toEqual([{ amount: 80, refundId: refund.refundId }]);
  });

  it('rejects a refund above the remaining captured balance before calling the provider', async () => {
    const target = booking(24);
    const h = acquiringHarness({
      target,
      payments: [
        payment({ appointmentId: target.id, id: 'pay-dep', amount: 150, status: PaymentStatus.DEPOSIT_PAID }),
      ],
    });

    await expect(
      h.refund.initiateRefund(target.id, 151, 'PAY-004', 'refund-over')
    ).rejects.toThrow('exceeds available captured amount');

    expect(h.provider.calls).toHaveLength(0);
    expect(h.fiscal.calls).toHaveLength(0);
    expect(target.refundId).toBeNull();
  });

  it('leaves a provider timeout failed and retryable, then completes with the same key', async () => {
    const target = booking(24);
    const h = acquiringHarness({
      target,
      provider: ['error', 'ok'],
      payments: [
        payment({ appointmentId: target.id, id: 'pay-dep', amount: 150, status: PaymentStatus.DEPOSIT_PAID }),
      ],
    });

    const { refund } = await h.refund.initiateRefund(target.id, undefined, 'PAY-004', 'refund-retry');

    expect(refund.status).toBe(RefundStatus.FAILED);
    expect(refund.adminNote).toContain('provider timeout');
    expect((await h.payments.findByAppointmentId(target.id))[0]?.status).toBe(
      PaymentStatus.DEPOSIT_PAID
    );
    expect(h.fiscal.calls).toHaveLength(0);

    const retried = await h.refund.retryRefund(refund.refundId);

    expect(retried.status).toBe(RefundStatus.COMPLETED);
    expect(h.provider.calls.map((call) => call.idempotencyKey)).toEqual([
      'refund-retry:pay-dep',
      'refund-retry:pay-dep',
    ]);
    expect((await h.payments.findByAppointmentId(target.id))[0]?.status).toBe(
      PaymentStatus.REFUNDED
    );
    expect(h.fiscal.calls).toHaveLength(1);
  });

  it('does not call the provider twice for a duplicate same-key retry', async () => {
    const target = booking(24);
    const h = acquiringHarness({
      target,
      payments: [
        payment({ appointmentId: target.id, id: 'pay-dep', amount: 150, status: PaymentStatus.DEPOSIT_PAID }),
      ],
    });

    const first = await h.refund.initiateRefund(target.id, undefined, 'PAY-004', 'refund-same');
    const second = await h.refund.initiateRefund(target.id, undefined, 'PAY-004', 'refund-same');

    expect(second.isDuplicate).toBe(true);
    expect(second.refund.refundId).toBe(first.refund.refundId);
    expect(h.provider.calls).toHaveLength(1);
    expect(h.fiscal.calls).toHaveLength(1);
  });

  it('retries only the expenditure receipt when the provider already confirmed', async () => {
    const target = booking(24);
    const h = acquiringHarness({
      target,
      receipt: ['failed', 'done'],
      payments: [
        payment({ appointmentId: target.id, id: 'pay-dep', amount: 150, status: PaymentStatus.DEPOSIT_PAID }),
      ],
    });

    const { refund } = await h.refund.initiateRefund(target.id, undefined, 'PAY-004', 'refund-rcpt');
    expect(refund.status).toBe(RefundStatus.FAILED);

    const retried = await h.refund.retryRefund(refund.refundId);

    expect(retried.status).toBe(RefundStatus.COMPLETED);
    expect(h.provider.calls).toHaveLength(1);
    expect(h.fiscal.calls).toHaveLength(2);
  });
});
