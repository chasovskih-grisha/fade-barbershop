// ForwardAnalyticsEvents (T-4587): один прохід воркера — перенести нові
// доменні події у чергу Amplitude і надіслати батч. Збій батчу не втрачає
// події: кожна отримує backoff, після 5 спроб — dead letter і аудит.
import { retryAt } from '../domain/amplitude-events';
import type { AmplitudeStore, AmplitudeTransport } from './amplitude.ports';

export const FORWARD_BATCH_SIZE = 100;
export const ENQUEUE_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export interface ForwardAnalyticsDeps {
  store: AmplitudeStore;
  transport: AmplitudeTransport;
  audit: (event: Record<string, string | number>) => void;
}

export interface ForwardResult {
  enqueued: number;
  sent: number;
  failed: number;
}

export class ForwardAnalyticsEvents {
  constructor(private readonly deps: ForwardAnalyticsDeps) {}

  async execute(now: Date = new Date()): Promise<ForwardResult> {
    const { store, transport } = this.deps;
    const enqueued = await store.enqueueRecent(new Date(now.getTime() - ENQUEUE_WINDOW_MS), 500);
    const pending = await store.pending(now, FORWARD_BATCH_SIZE);
    if (pending.length === 0) return { enqueued, sent: 0, failed: 0 };
    try {
      await transport.send(pending.map((row) => row.event));
      await store.markSent(pending.map((row) => row.id), now);
      this.deps.audit({ scope: 'amplitude', status: 'sent', count: pending.length });
      return { enqueued, sent: pending.length, failed: 0 };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      for (const row of pending) await this.fail(row, now, message);
      return { enqueued, sent: 0, failed: pending.length };
    }
  }

  private async fail(
    row: { id: string; attempts: number },
    now: Date,
    message: string
  ): Promise<void> {
    const attempts = row.attempts + 1;
    const next = attempts >= MAX_ATTEMPTS ? null : retryAt(attempts, now);
    await this.deps.store.markFailed(row.id, next, message.slice(0, 300));
    this.deps.audit({
      scope: 'amplitude',
      status: next ? 'retry' : 'dead_letter',
      attempts,
      eventId: row.id,
    });
  }
}
