// Спільна база доменних подій (locations, haircut-ai, ...): outbox-реле читає
// type + payload (T-042), occurredAt — службове і в payload не потрапляє.

export abstract class DomainEvent {
  abstract readonly type: string;
  readonly occurredAt: Date;
  readonly aggregateId: string;
  abstract readonly payload: Record<string, unknown>;

  constructor(params: { occurredAt: Date; aggregateId: string }) {
    this.occurredAt = params.occurredAt;
    this.aggregateId = params.aggregateId;
  }
}

/** Payload події без службового occurredAt — outbox-реле пише саме його. */
export function payloadOf<T extends { occurredAt: Date }>(params: T): Omit<T, 'occurredAt'> {
  const entries = Object.entries(params).filter(([key]) => key !== 'occurredAt');
  return Object.fromEntries(entries) as Omit<T, 'occurredAt'>;
}

/** Подія в outbox: bundle-конструктор (гейт max-params ≤ 3), payload без occurredAt. */
export abstract class OutboxEvent<P extends Record<string, unknown>> extends DomainEvent {
  readonly payload: P;

  protected constructor(params: P & { occurredAt: Date }, aggregateId: string) {
    super({ occurredAt: params.occurredAt, aggregateId });
    this.payload = payloadOf(params) as unknown as P;
  }
}
