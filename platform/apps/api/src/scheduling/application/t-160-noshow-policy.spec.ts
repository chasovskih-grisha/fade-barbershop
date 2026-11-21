/* eslint-disable max-lines -- cohesive module (152 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// Специфікація T-160: no-show утримує депозит без руху платежу (NSH-003),
// а зняття no-show адміном повертає депозит через T-094 (NSH-ADM-03 /
// PAY-005б) з обовʼязковим логом і ідемпотентністю.
import { Booking } from '../domain/booking';
import { RefundStatus } from '../../payment/domain/refund.entity';
import {
  T094Refund,
  type ExpenditureReceiptGateway,
  type RefundBookingPort,
} from '../../payment/application/refund.use-case';
import { NoShowPenaltyService } from './no-show-penalty.service';
import { T160NoShowPolicy } from './t-160-noshow-policy.use-case';

const START = new Date('2026-11-20T10:00:00.000Z');

class MemoryBookingRepository implements RefundBookingPort {
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

  async findOverlaps(): Promise<Booking[]> {
    return [];
  }

  async findAllOverlaps(): Promise<Booking[]> {
    return [];
  }

  async findForBarberAtLocation(): Promise<Booking[]> {
    return [];
  }

  async findBarberOverlaps(): Promise<Booking[]> {
    return [];
  }
}

function booking(price = 500): Booking {
  const item = Booking.create({
    barberId: 'barber-1',
    locationId: 'loc-1',
    clientId: 'client-1',
    start: START,
    end: new Date(START.getTime() + 30 * 60_000),
    agreedPrice: price,
    finalPrice: price,
  });
  item.depositStatus = 'captured';
  item.noShowStatus = 'confirmed';
  return item;
}

function refundGateway(): ExpenditureReceiptGateway & { calls: number[] } {
  const calls: number[] = [];
  return {
    calls,
    async issueRefundReceipt(input) {
      calls.push(input.amount);
      return { receiptId: `expenditure_${input.refundId}`, status: 'done' as const };
    },
  };
}

function harness(target = booking()) {
  const repo = new MemoryBookingRepository([target]);
  const fiscal = refundGateway();
  const refund = new T094Refund(repo, fiscal);
  const policy = new T160NoShowPolicy(repo, new NoShowPenaltyService(), refund, () => START);
  return { repo, fiscal, refund, policy, target };
}

describe('T160NoShowPolicy (T-160)', () => {
  it('retains the deposit on a no-show and never calls the refund port (NSH-003)', async () => {
    const h = harness();

    const result = await h.policy.processNoShow(h.target);

    expect(result.refundInitiated).toBe(false);
    expect(result.auditEntry).toMatchObject({
      stage: 'deposit_retained',
      forfeitedDeposit: 150,
      executedBy: 'auto_system',
    });
    expect(h.target.status).toBe('no_show');
    expect(h.target.noShowStatus).toBe('confirmed');
    expect(h.repo.saved).toContain(h.target.id);
    expect(h.fiscal.calls).toHaveLength(0);
    expect(h.target.refundStatus).toBeNull();
  });

  it('records who marked the no-show and the reason', async () => {
    const h = harness();

    const result = await h.policy.processNoShow(h.target, 'admin-1', 'client arrived late');

    expect(result.auditEntry.executedBy).toBe('admin');
    expect(result.auditEntry.reason).toBe('client arrived late');
  });

  it('refunds the deposit when the admin removes the no-show (NSH-ADM-03)', async () => {
    const h = harness();

    const result = await h.policy.removeNoShow(h.target, {
      adminId: 'admin-1',
      reason: 'клієнт був у лікарні',
    });

    expect(result.refund.status).toBe(RefundStatus.COMPLETED);
    expect(result.refund.amount).toBe(150);
    expect(result.refund.refundId).toBe(`ns_remove_${h.target.id}`);
    expect(h.fiscal.calls).toEqual([150]);
    expect(h.target.noShowStatus).toBe('removed');
    expect(h.target.refundStatus).toBe(RefundStatus.COMPLETED);
    expect(result.auditEntry).toMatchObject({
      stage: 'no_show_removed',
      executedBy: 'admin',
      forfeitedDeposit: 0,
    });
    expect(result.auditEntry.reason).toContain('клієнт був у лікарні');
  });

  it('is idempotent on repeated removal (PAY-006)', async () => {
    const h = harness();

    const first = await h.policy.removeNoShow(h.target, { adminId: 'admin-1', reason: 'помилка' });
    const second = await h.policy.removeNoShow(h.target, { adminId: 'admin-1', reason: 'помилка' });

    expect(second.isDuplicate).toBe(true);
    expect(second.refund.refundId).toBe(first.refund.refundId);
    expect(h.fiscal.calls).toHaveLength(1);
  });

  it('requires a reason and an admin for the removal', async () => {
    const h = harness();

    await expect(
      h.policy.removeNoShow(h.target, { adminId: 'admin-1', reason: '   ' })
    ).rejects.toThrow('Removal reason is required');
    await expect(
      h.policy.removeNoShow(h.target, { adminId: '', reason: 'помилка' })
    ).rejects.toThrow('Admin id is required');
    expect(h.fiscal.calls).toHaveLength(0);
  });

  it('does not clear the flag when nothing was captured to refund', async () => {
    const h = harness(booking());
    h.target.depositStatus = null;

    await expect(
      h.policy.removeNoShow(h.target, { adminId: 'admin-1', reason: 'клієнт був у лікарні' })
    ).rejects.toThrow('No captured payment to refund');
    expect(h.target.noShowStatus).toBe('confirmed');
  });

  it('keeps the threshold rule for repeat no-shows (NSH-006)', async () => {
    const h = harness();
    const history = [
      {
        clientId: 'client-1',
        noShowDates: [new Date(START.getTime() - 1_000), new Date(START.getTime() - 2_000)],
      },
    ];

    await expect(h.policy.checkRepeatBookingRequirement('client-1', history)).resolves.toEqual({
      requireFullPrepayment: true,
      recentNoShowCount: 2,
      waiverActive: false,
    });
  });
});
