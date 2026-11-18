// T-4587: воркер надсилає батч, позначає sent; збій — retry з backoff,
// після 5 спроб — dead letter. Події не втрачаються і не дублюються.
import { ForwardAnalyticsEvents } from './forward-analytics-events';
import type { AmplitudeStore, StoredAmplitudeEvent } from './amplitude.ports';
import type { AmplitudeEvent } from '../domain/amplitude-events';

const NOW = new Date('2026-11-17T10:00:00Z');
const event = (id: string): AmplitudeEvent => ({
  event_type: 'booking_confirmed',
  insert_id: `booking_confirmed_${id}_1`,
  time: NOW.getTime(),
  event_properties: {},
});

class FakeStore implements AmplitudeStore {
  readonly rows: (StoredAmplitudeEvent & { nextAt?: Date | null; error?: string })[] = [];
  sent: string[] = [];
  enqueued = 0;

  async enqueueRecent(): Promise<number> {
    return this.enqueued;
  }
  async pending(_now: Date, limit: number): Promise<StoredAmplitudeEvent[]> {
    return this.rows
      .filter((row) => !this.sent.includes(row.id))
      .slice(0, limit)
      .map(({ id, event: value, attempts }) => ({ id, event: value, attempts }));
  }
  async markSent(ids: readonly string[]): Promise<void> {
    this.sent.push(...ids);
  }
  async markFailed(id: string, nextAttemptAt: Date | null, error: string): Promise<void> {
    const row = this.rows.find((item) => item.id === id);
    if (row) {
      row.attempts += 1;
      row.nextAt = nextAttemptAt;
      row.error = error;
    }
  }
}

function build(fail = false) {
  const store = new FakeStore();
  const audit: Record<string, string | number>[] = [];
  const sent: AmplitudeEvent[][] = [];
  const transport = {
    send: async (events: readonly AmplitudeEvent[]) => {
      if (fail) throw new Error('amplitude 500');
      sent.push([...events]);
    },
  };
  const forward = new ForwardAnalyticsEvents({ store, transport, audit: (e) => audit.push(e) });
  return { store, audit, sent, forward };
}

describe('ForwardAnalyticsEvents (T-4587)', () => {
  it('надсилає pending-батч і позначає події sent', async () => {
    const { store, forward, audit } = build();
    store.rows.push({ id: 'e1', event: event('e1'), attempts: 0 });
    store.rows.push({ id: 'e2', event: event('e2'), attempts: 0 });
    store.enqueued = 2;

    await expect(forward.execute(NOW)).resolves.toEqual({ enqueued: 2, sent: 2, failed: 0 });

    expect(store.sent).toEqual(['e1', 'e2']);
    expect(audit).toEqual([expect.objectContaining({ status: 'sent', count: 2 })]);
  });

  it('порожня черга не викликає транспорт', async () => {
    const { forward, sent } = build();
    await expect(forward.execute(NOW)).resolves.toEqual({ enqueued: 0, sent: 0, failed: 0 });
    expect(sent).toHaveLength(0);
  });

  it('збій транспорту планує retry і не позначає sent', async () => {
    const { store, forward, audit } = build(true);
    store.rows.push({ id: 'e1', event: event('e1'), attempts: 0 });

    await expect(forward.execute(NOW)).resolves.toMatchObject({ sent: 0, failed: 1 });

    expect(store.sent).toEqual([]);
    expect(store.rows[0]?.attempts).toBe(1);
    expect(store.rows[0]?.nextAt?.toISOString()).toBe('2026-11-17T10:01:00.000Z');
    expect(audit).toEqual([expect.objectContaining({ status: 'retry', attempts: 1 })]);
  });

  it('після 5 невдач подія стає dead letter', async () => {
    const { store, forward } = build(true);
    store.rows.push({ id: 'e1', event: event('e1'), attempts: 4 });

    await forward.execute(NOW);

    expect(store.rows[0]?.nextAt).toBeNull();
    expect(store.rows[0]?.attempts).toBe(5);
  });
});
