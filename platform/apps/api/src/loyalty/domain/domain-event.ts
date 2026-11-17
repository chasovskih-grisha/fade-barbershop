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
