// T-4490: purge видаляє за TTL, перевіряє залишок і пише аудит; legal hold
// пропускає набір, але фіксує це.
import { PurgeExpiredData } from './purge-expired-data';
import type { RetentionStore } from './retention.ports';
import type { RetentionAuditEntry, RetentionDataset } from './retention-policy';

const NOW = new Date('2026-11-17T10:00:00Z');

class FakeStore implements RetentionStore {
  readonly purged: { dataset: string; cutoff: string }[] = [];
  readonly audits: { entry: RetentionAuditEntry; at: Date }[] = [];
  counts: Record<string, number> = { otp_challenges: 3, sessions: 2, notification_records: 0 };
  leftover = 0;

  async purge(dataset: RetentionDataset, cutoff: Date): Promise<number> {
    this.purged.push({ dataset, cutoff: cutoff.toISOString() });
    return this.counts[dataset] ?? 0;
  }
  async remainingExpired(): Promise<number> {
    return this.leftover;
  }
  async recordAudit(entry: RetentionAuditEntry, at: Date): Promise<void> {
    this.audits.push({ entry, at });
  }
}

describe('PurgeExpiredData (T-4490)', () => {
  it('видаляє кожен набір за власним TTL і сумує результат', async () => {
    const store = new FakeStore();
    const purge = new PurgeExpiredData({ store, holds: new Set() });

    const result = await purge.execute(NOW);

    expect(result.purged).toEqual({ otp_challenges: 3, sessions: 2, notification_records: 0 });
    expect(result.total).toBe(5);
    expect(store.purged).toEqual([
      { dataset: 'otp_challenges', cutoff: '2026-11-10T10:00:00.000Z' },
      { dataset: 'sessions', cutoff: '2026-10-18T10:00:00.000Z' },
      { dataset: 'notification_records', cutoff: '2026-08-19T10:00:00.000Z' },
    ]);
  });

  it('пише аудит на кожен набір, включно з нульовими', async () => {
    const store = new FakeStore();
    await new PurgeExpiredData({ store, holds: new Set() }).execute(NOW);
    expect(store.audits).toHaveLength(3);
    expect(store.audits[0]?.entry).toMatchObject({
      dataset: 'otp_challenges',
      purged: 3,
      held: false,
    });
    expect(store.audits[0]?.at).toBe(NOW);
  });

  it('legal hold не видаляє нічого, але лишає слід в аудиті', async () => {
    const store = new FakeStore();
    const result = await new PurgeExpiredData({
      store,
      holds: new Set(['sessions']),
    }).execute(NOW);

    expect(result.purged.sessions).toBe(0);
    expect(store.purged.some((item) => item.dataset === 'sessions')).toBe(false);
    expect(store.audits.find((item) => item.entry.dataset === 'sessions')?.entry?.held).toBe(true);
  });

  it('пост-перевірка показує прострочені залишки', async () => {
    const store = new FakeStore();
    store.leftover = 1;

    const result = await new PurgeExpiredData({ store, holds: new Set() }).execute(NOW);

    expect(result.remainingExpired).toBe(3);
  });
});
