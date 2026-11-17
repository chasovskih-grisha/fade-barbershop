// Події лояльності crm — окремо від реєстрації/нотаток (гейт max-lines).

import { DomainEvent } from './domain-event';

export class VipDiscountChanged extends DomainEvent {
  readonly type = 'crm.vip_discount.changed';
  readonly payload: Record<string, unknown>;

  constructor(params: {
    clientId: string;
    oldPercent: number | null;
    newPercent: number | null;
    changedBy: string;
    occurredAt: Date;
  }) {
    super({ occurredAt: params.occurredAt, aggregateId: params.clientId });
    this.payload = {
      clientId: params.clientId,
      oldPercent: params.oldPercent,
      newPercent: params.newPercent,
      changedBy: params.changedBy,
    };
  }
}

export class LoyaltyVisitsChanged extends DomainEvent {
  readonly type = 'crm.loyalty.visits_changed';
  readonly payload: Record<string, unknown>;

  constructor(params: {
    clientId: string;
    oldCount: number;
    newCount: number;
    changedBy: string;
    occurredAt: Date;
  }) {
    super({ occurredAt: params.occurredAt, aggregateId: params.clientId });
    this.payload = {
      clientId: params.clientId,
      oldCount: params.oldCount,
      newCount: params.newCount,
      changedBy: params.changedBy,
    };
  }
}

export class LoyaltyVisitsIncremented extends DomainEvent {
  readonly type = 'crm.loyalty.visits_incremented';
  readonly payload: {
    clientId: string;
    oldCount: number;
    newCount: number;
    appointmentId: string;
  };

  constructor(params: {
    clientId: string;
    oldCount: number;
    newCount: number;
    appointmentId: string;
    occurredAt: Date;
  }) {
    super({ occurredAt: params.occurredAt, aggregateId: params.clientId });
    this.payload = {
      clientId: params.clientId,
      oldCount: params.oldCount,
      newCount: params.newCount,
      appointmentId: params.appointmentId,
    };
  }
}
