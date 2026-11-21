/* eslint-disable max-lines -- cohesive module (163 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// Специфікація T-094: автоматичний refund у межах вікна скасування,
// команда адміна поза вікном (no-show), ідемпотентність першого коміту,
// видатковий чек, `failed` і повтори (PAY-005…010).
import { Booking } from '../../scheduling/domain/booking';
import { RefundReason, RefundStatus } from '../domain/refund.entity';
import {
  MAX_REFUND_RETRIES,
  T094Refund,
  canRefundCancellation,
  type ExpenditureReceiptGateway,
  type RefundBookingPort,
} from './refund.use-case';

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

  it('caps a partial request at the captured amount (PAY-010)', async () => {
    const h = harness();

    const { refund } = await h.refund.initiateRefund(h.target.id, 1_000);

    expect(refund.amount).toBe(150);
    expect(h.refund.validateRefundAmount(150, 0)).toBe(0);
    expect(h.refund.validateRefundAmount(150, 80)).toBe(80);
  });

  it('refuses a cancellation after the free window and keeps the deposit', async () => {
    const h = harness({ target: booking(1) });

    await expect(h.refund.initiateRefund(h.target.id, undefined, 'PAY-004')).rejects.toThrow(
      'free cancellation window'
    );
    expect(h.fiscal.calls).toHaveLength(0);
    expect(h.target.refundStatus).toBeNull();
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
