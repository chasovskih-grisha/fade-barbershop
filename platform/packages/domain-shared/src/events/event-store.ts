import type { DomainEvent } from './types';

/** One immutable fact inside an aggregate stream. Sequence starts at 1. */
export interface StoredEvent {
  readonly streamId: string;
  readonly sequence: number;
  readonly event: DomainEvent;
}

export class OptimisticConcurrencyError extends Error {
  constructor(
    readonly streamId: string,
    readonly expectedVersion: number,
    readonly actualVersion: number
  ) {
    super(
      `Stream ${streamId} expected version ${expectedVersion} but is at ${actualVersion}`
    );
    this.name = 'OptimisticConcurrencyError';
  }
}

/**
 * Append-only in-memory event store: streams are per aggregate, `readAll`
 * replays the global order for projections and audit ledgers.
 */
export class InMemoryEventStore {
  private readonly streams = new Map<string, StoredEvent[]>();
  private readonly global: StoredEvent[] = [];

  append(
    streamId: string,
    events: readonly DomainEvent[],
    expectedVersion?: number
  ): readonly StoredEvent[] {
    const stream = this.streams.get(streamId) ?? [];
    if (expectedVersion !== undefined && expectedVersion !== stream.length) {
      throw new OptimisticConcurrencyError(streamId, expectedVersion, stream.length);
    }
    const stored = events.map((event, index) => ({
      streamId,
      sequence: stream.length + index + 1,
      event,
    }));
    this.streams.set(streamId, [...stream, ...stored]);
    this.global.push(...stored);
    return stored;
  }

  readStream(streamId: string): readonly StoredEvent[] {
    return [...(this.streams.get(streamId) ?? [])];
  }

  readAll(): readonly StoredEvent[] {
    return [...this.global];
  }

  /** Folds a stream into state; use for rebuilds, never mutate stored events. */
  replay<TState>(
    streamId: string,
    reducer: (state: TState, event: DomainEvent) => TState,
    initial: TState
  ): TState {
    return this.readStream(streamId).reduce(
      (state, stored) => reducer(state, stored.event),
      initial
    );
  }

  version(streamId: string): number {
    return this.streams.get(streamId)?.length ?? 0;
  }
}
