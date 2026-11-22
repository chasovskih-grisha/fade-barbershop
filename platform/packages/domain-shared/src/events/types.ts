/**
 * Domain event bus contracts (T-5001).
 * Shared kernel only: no transport, persistence or framework imports.
 */

/** Immutable fact published by one context and consumed by others. */
export interface DomainEvent<TPayload = unknown> {
  readonly id: string;
  readonly name: string;
  readonly aggregateId: string;
  readonly occurredAt: Date;
  readonly version: number;
  readonly payload: TPayload;
}

/** Event plus delivery bookkeeping. `attempt` starts at 1. */
export interface EventEnvelope<TPayload = unknown> {
  readonly event: DomainEvent<TPayload>;
  readonly attempt: number;
  readonly enqueuedAt: Date;
}

export type EventHandler<TPayload = unknown> = (
  event: DomainEvent<TPayload>
) => Promise<void> | void;

export type Unsubscribe = () => void;

export interface RetryPolicy {
  readonly maxAttempts: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
}

export interface DeadLetterEntry<TPayload = unknown> {
  readonly envelope: EventEnvelope<TPayload>;
  readonly failedAt: Date;
  readonly reason: string;
}

export interface EventPublisher {
  publish(events: readonly DomainEvent[]): Promise<void>;
}

export interface EventSubscriber {
  subscribe(name: string, handler: EventHandler): Unsubscribe;
}

/** Publisher and subscriber in one port; adapters choose the transport. */
export interface EventBus extends EventPublisher, EventSubscriber {}
