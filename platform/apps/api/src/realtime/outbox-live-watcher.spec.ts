// Релей живого оновлення: публікує лише НОВІ події візитів, зсуває watermark,
// порожній прохід його не рухає, помилка тіка не вбиває цикл.
import { AdminLiveFeed } from './admin-live-feed';
import { OutboxLiveWatcher } from './outbox-live-watcher';

const START = new Date('2026-10-07T10:00:00.000Z');

const row = (appointmentId: string, createdAt: Date, type = 'scheduling.appointment.booked') => ({
  type,
  aggregateId: appointmentId,
  createdAt,
});

function makeWatcher(rows: unknown[] = []) {
  const findMany = jest.fn().mockResolvedValue(rows);
  const prisma = { outboxMessage: { findMany } };
  const feed = new AdminLiveFeed();
  const published: unknown[] = [];
  feed.stream$.subscribe((notice) => published.push(notice));
  const watcher = new OutboxLiveWatcher(prisma as never, feed, () => START);
  const timer = () => (watcher as unknown as { timer?: unknown }).timer;
  return { watcher, findMany, published, timer };
}

describe('OutboxLiveWatcher (T-045)', () => {
  it('публікує нові події та шукає з watermark старту процесу', async () => {
    const rows = [
      row('apt-1', new Date('2026-10-07T10:00:05.000Z')),
      row('apt-2', new Date('2026-10-07T10:00:09.000Z'), 'scheduling.appointment.cancelled'),
    ];
    const { watcher, findMany, published } = makeWatcher(rows);

    await expect(watcher.pollOnce()).resolves.toEqual({ published: 2 });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { type: { in: expect.any(Array) }, createdAt: { gt: START } },
        orderBy: { createdAt: 'asc' },
      })
    );
    expect(published).toEqual([
      { type: 'scheduling.appointment.booked', appointmentId: 'apt-1' },
      { type: 'scheduling.appointment.cancelled', appointmentId: 'apt-2' },
    ]);
  });

  it('наступний прохід шукає лише після останньої баченої події', async () => {
    const last = new Date('2026-10-07T10:00:05.000Z');
    const { watcher, findMany } = makeWatcher([row('apt-1', last)]);

    await watcher.pollOnce();
    await watcher.pollOnce();

    expect(findMany.mock.calls[1][0].where.createdAt.gt).toEqual(last);
  });

  it('порожній прохід не зсуває watermark', async () => {
    const { watcher, findMany } = makeWatcher([]);

    await expect(watcher.pollOnce()).resolves.toEqual({ published: 0 });
    await watcher.pollOnce();

    expect(findMany.mock.calls[1][0].where.createdAt.gt).toEqual(START);
  });

  it('автостарт вимкнено в тестовому середовищі; start(0) не планує тік', () => {
    const { watcher, timer } = makeWatcher();

    expect(() => watcher.onApplicationBootstrap()).not.toThrow();
    watcher.start(0);

    expect(timer()).toBeUndefined();
  });

  it('помилка проходу не вбиває цикл: наступний тік планується', async () => {
    jest.useFakeTimers();
    try {
      const { watcher, findMany } = makeWatcher();
      findMany.mockRejectedValue(new Error('boom'));

      watcher.start(10);
      await jest.advanceTimersByTimeAsync(25);

      expect(findMany.mock.calls.length).toBeGreaterThanOrEqual(2);
      watcher.stop();
    } finally {
      jest.useRealTimers();
    }
  });
});
