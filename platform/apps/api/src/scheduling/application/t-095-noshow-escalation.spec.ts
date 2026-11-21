/* eslint-disable max-lines -- cohesive module (161 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// Специфікація T-095: ескалація прострочених no-show через 24 години.
// Дефолт — утримання депозиту (NSH-003); зняття ескалації повертає гроші
// через T-094, тож правила refund-порту перевіряються тут же.
import { Booking } from '../domain/booking';
import { RefundStatus } from '../../payment/domain/refund.entity';
import {
  T094Refund,
  type ExpenditureReceiptGateway,
  type RefundBookingPort,
} from '../../payment/application/refund.use-case';
import { setPushSender, type PushPayload } from '../../lib/notifications';
import {
  T095NoShowEscalation,
  type EscalationBookingReader,
} from './t-095-noshow-escalation.use-case';

const NOW = new Date('2026-11-21T12:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;

class MemoryBookings implements RefundBookingPort, EscalationBookingReader {
  readonly saved: string[] = [];
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
    this.saved.push(item.id);
    this.items.set(item.id, item);
  }

  async findMany(): Promise<Booking[]> {
    return [...this.items.values()].filter((item) => item.noShowStatus === 'pending');
  }

  async count(): Promise<number> {
    return this.items.size;
  }
}

function booking(options: { startDaysAgo?: number; pending?: boolean } = {}): Booking {
  const start = new Date(NOW.getTime() - (options.startDaysAgo ?? 2) * DAY_MS);
  const item = Booking.create({
    barberId: 'barber-1',
    locationId: 'loc-1',
    clientId: 'client-1',
    start,
    end: new Date(start.getTime() + 30 * 60_000),
    agreedPrice: 500,
    finalPrice: 500,
  });
  item.depositStatus = 'captured';
  item.noShowStatus = options.pending === false ? 'confirmed' : 'pending';
  return item;
}

function refundGateway(fail = false): ExpenditureReceiptGateway & { calls: number[] } {
  const calls: number[] = [];
  return {
    calls,
    async issueRefundReceipt(input) {
      calls.push(input.amount);
      return fail
        ? { receiptId: '', status: 'failed' as const, error: 'acquiring unavailable' }
        : { receiptId: `expenditure_${input.refundId}`, status: 'done' as const };
    },
  };
}

function harness(options: { target?: Booking; fail?: boolean } = {}) {
  const target = options.target ?? booking();
  const repo = new MemoryBookings([target]);
  const fiscal = refundGateway(options.fail);
  const refund = new T094Refund(repo, fiscal);
  const sent: PushPayload[] = [];
  setPushSender({
    async send(payload) {
      sent.push(payload);
    },
  });
  return { escalation: new T095NoShowEscalation(repo, refund), repo, fiscal, sent, target };
}

afterEach(() => {
  setPushSender({ async send() {} });
});

describe('T095NoShowEscalation (T-095)', () => {
  it('finds only pending no-shows older than 24 hours', async () => {
    const old = booking({ startDaysAgo: 2 });
    const fresh = booking({ startDaysAgo: 0 });
    const repo = new MemoryBookings([old, fresh]);
    const escalation = new T095NoShowEscalation(repo, new T094Refund(repo, refundGateway()));

    const eligible = await escalation.findEligibleForEscalation(NOW);

    expect(eligible.map((item) => item.id)).toEqual([old.id]);
    expect((await escalation.findEligibleForEscalation(NOW)).map((item) => item.id)).not.toContain(
      fresh.id
    );
  });

  it('retains the deposit by default and sends the neutral push (NSH-003/NSH-007)', async () => {
    const h = harness();

    const result = await h.escalation.escalateBooking(h.target, { now: NOW });

    expect(result.refund).toBeNull();
    expect(result.notificationSent).toBe(true);
    expect(h.target.noShowStatus).toBe('escalated');
    expect(h.target.status).toBe('cancelled');
    expect(h.fiscal.calls).toHaveLength(0);
    expect(h.sent).toHaveLength(1);
    expect(h.sent[0]?.body).not.toMatch(/штраф/);
  });

  it('refunds the captured deposit when the escalation is withdrawn (PAY-005б)', async () => {
    const h = harness();

    const result = await h.escalation.escalateBooking(h.target, {
      resolution: 'refund',
      now: NOW,
    });

    expect(result.refund?.status).toBe(RefundStatus.COMPLETED);
    expect(result.refund?.amount).toBe(150);
    expect(result.refund?.refundId).toBe(`ns_${h.target.id}`);
    expect(h.target.noShowRefundId).toBe(`ns_${h.target.id}`);
    expect(h.fiscal.calls).toEqual([150]);
    expect(h.target.noShowStatus).toBe('escalated');
  });

  it('keeps the visit but records the failure when the refund cannot settle (PAY-009)', async () => {
    const h = harness({ fail: true });

    const result = await h.escalation.escalateBooking(h.target, {
      resolution: 'refund',
      now: NOW,
    });

    expect(result.refund?.status).toBe(RefundStatus.FAILED);
    expect(result.refundError).toBeUndefined();
    expect(h.target.noShowStatus).toBe('escalated');
  });

  it('surfaces a failed refund initiation instead of escalating with money gone', async () => {
    const h = harness();
    h.target.depositStatus = null;

    const result = await h.escalation.escalateBooking(h.target, {
      resolution: 'refund',
      now: NOW,
    });

    expect(result.refund).toBeNull();
    expect(result.refundError).toContain('No captured payment');
    expect(h.target.noShowStatus).toBe('escalation_failed');
  });

  it('walks every eligible visit in one pass without stopping on errors', async () => {
    const payable = booking();
    const broken = booking();
    broken.depositStatus = null;
    const repo = new MemoryBookings([payable, broken]);
    const fiscal = refundGateway();
    const escalation = new T095NoShowEscalation(repo, new T094Refund(repo, fiscal));

    const summary = await escalation.runEscalation({
      resolution: 'refund',
      reasonCode: 'NSH-ADM-03',
      now: NOW,
    });

    expect(summary.totalEscalated).toBe(2);
    expect(summary.totalRefunded).toBe(150);
    expect(summary.errors[0]).toContain('No captured payment');
  });

  it('is idempotent on a repeated escalation of the same visit', async () => {
    const h = harness();

    const first = await h.escalation.escalateBooking(h.target, { resolution: 'refund', now: NOW });
    const second = await h.escalation.escalateBooking(h.target, { resolution: 'refund', now: NOW });

    expect(second.refund?.refundId).toBe(first.refund?.refundId);
    expect(h.fiscal.calls).toHaveLength(1);
  });
});
