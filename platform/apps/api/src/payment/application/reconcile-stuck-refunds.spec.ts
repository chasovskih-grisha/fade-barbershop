// T-4616b: тік доводить застряглі `processing`-повернення до кінця, бере лише
// старші за поріг і не валить весь прогін через одну ногу.
import {
  ReconcileStuckRefunds,
  type StuckRefund,
  type StuckRefundRepository,
} from './reconcile-stuck-refunds.use-case';

const now = new Date('2026-11-26T12:00:00.000Z');
const stuckRefund = (refundId: string): StuckRefund => ({
  refundId,
  bookingId: `booking-${refundId}`,
  initiatedAt: new Date('2026-11-26T10:00:00.000Z'),
});

function setup(
  stuck: StuckRefund[],
  resume: (refundId: string) => Promise<{ refundId: string; status: string }>
) {
  const repository: StuckRefundRepository & { lastQuery?: unknown } = {
    listStuck: jest.fn(async (query) => {
      repository.lastQuery = query;
      return stuck;
    }),
  };
  const reconcile = new ReconcileStuckRefunds({
    stuck: repository,
    refunds: { resumeProcessing: jest.fn(resume) },
    clock: { now: () => now },
    staleAfterMinutes: 15,
    limit: 20,
  });
  return { reconcile, repository };
}

describe('ReconcileStuckRefunds (T-4616b)', () => {
  it('питає лише за повернення, старші за поріг', async () => {
    const { reconcile, repository } = setup([], async () => ({
      refundId: 're_1',
      status: 'completed',
    }));

    await reconcile.run();

    expect(repository.lastQuery).toEqual({
      olderThan: new Date('2026-11-26T11:45:00.000Z'),
      limit: 20,
    });
  });

  it('дописує завершене повернення і не вважає його збоєм', async () => {
    const { reconcile } = setup([stuckRefund('re_1')], async (refundId) => ({
      refundId,
      status: 'completed',
    }));

    await expect(reconcile.run()).resolves.toEqual([
      { refundId: 're_1', bookingId: 'booking-re_1', status: 'completed' },
    ]);
  });

  it('збій одного повернення не зриває решту', async () => {
    const { reconcile } = setup([stuckRefund('re_1'), stuckRefund('re_2')], async (refundId) => {
      if (refundId === 're_1') throw new Error('acquiring unavailable');
      return { refundId, status: 'failed' };
    });

    await expect(reconcile.run()).resolves.toEqual([
      {
        refundId: 're_1',
        bookingId: 'booking-re_1',
        status: 'error',
        detail: 'acquiring unavailable',
      },
      { refundId: 're_2', bookingId: 'booking-re_2', status: 'failed' },
    ]);
  });

  it('без застряглих повернень нікого не чіпає', async () => {
    const resume = jest.fn();
    const { reconcile } = setup([], resume);

    await expect(reconcile.run()).resolves.toEqual([]);
    expect(resume).not.toHaveBeenCalled();
  });
});
