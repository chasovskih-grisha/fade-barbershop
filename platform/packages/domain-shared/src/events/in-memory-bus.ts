import { attemptsExhausted, DEFAULT_RETRY_POLICY, retryDelayMs } from './backoff';
import type {
  DeadLetterEntry,
  DomainEvent,
  EventBus,
  EventEnvelope,
  EventHandler,
  RetryPolicy,
  Unsubscribe,
} from './types';

export interface InMemoryBusOptions {
  readonly retryPolicy?: RetryPolicy;
  readonly sleep?: (ms: number) => Promise<void>;
  readonly now?: () => Date;
  readonly random?: () => number;
}

/**
 * Reference `EventBus` for tests and single-process deployments.
 * Delivery is at-least-once: a failing handler retries the whole event, so
 * handlers must be idempotent. Exhausted events land in the DLQ.
 */
export class InMemoryEventBus implements EventBus {
  private readonly handlers = new Map<string, Set<EventHandler>>();
  private readonly queue: EventEnvelope[] = [];
  private readonly deadLetters: DeadLetterEntry[] = [];
  private readonly delivered: string[] = [];
  private readonly policy: RetryPolicy;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly now: () => Date;
  private readonly random: () => number;

  constructor(options: InMemoryBusOptions = {}) {
    this.policy = options.retryPolicy ?? DEFAULT_RETRY_POLICY;
    this.sleep = options.sleep ?? defaultSleep;
    this.now = options.now ?? (() => new Date());
    this.random = options.random ?? Math.random;
  }

  subscribe(name: string, handler: EventHandler): Unsubscribe {
    const handlers = this.handlers.get(name) ?? new Set<EventHandler>();
    handlers.add(handler);
    this.handlers.set(name, handlers);
    return () => {
      handlers.delete(handler);
    };
  }

  async publish(events: readonly DomainEvent[]): Promise<void> {
    for (const event of events) {
      this.queue.push({ event, attempt: 1, enqueuedAt: this.now() });
    }
    await this.drain();
  }

  /** Re-attempts whatever is still queued; safe to call after an outage. */
  async drain(): Promise<void> {
    let envelope = this.queue.shift();
    while (envelope) {
      await this.deliver(envelope);
      envelope = this.queue.shift();
    }
  }

  get deadLetterQueue(): readonly DeadLetterEntry[] {
    return [...this.deadLetters];
  }

  get deliveredIds(): readonly string[] {
    return [...this.delivered];
  }

  private async deliver(envelope: EventEnvelope): Promise<void> {
    const handlers = [...(this.handlers.get(envelope.event.name) ?? [])];
    if (handlers.length === 0) {
      this.delivered.push(envelope.event.id);
      return;
    }
    try {
      for (const handler of handlers) {
        await handler(envelope.event);
      }
      this.delivered.push(envelope.event.id);
    } catch (error) {
      await this.retryOrDeadLetter(envelope, error);
    }
  }

  private async retryOrDeadLetter(envelope: EventEnvelope, error: unknown): Promise<void> {
    const reason = error instanceof Error ? error.message : String(error);
    if (attemptsExhausted(envelope.attempt, this.policy)) {
      this.deadLetters.push({ envelope, failedAt: this.now(), reason });
      return;
    }
    const delay = retryDelayMs(envelope.attempt, this.policy, this.random);
    await this.sleep(delay);
    await this.deliver({ ...envelope, attempt: envelope.attempt + 1 });
  }
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
