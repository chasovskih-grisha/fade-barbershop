/* eslint-disable max-lines -- cohesive module (194 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
import { DomainEvent } from './domain-event';

export class FreeVisitGranted extends DomainEvent {
  readonly type = 'loyalty.free_visit.granted';
  readonly payload: { clientId: string; counter: number };

  constructor(params: { clientId: string; counter: number; occurredAt: Date }) {
    super({ occurredAt: params.occurredAt, aggregateId: params.clientId });
    this.payload = { clientId: params.clientId, counter: params.counter };
  }
}

export class FreeVisitApplied extends DomainEvent {
  readonly type = 'loyalty.free_visit.applied';
  readonly payload: { clientId: string; appointmentId: string };

  constructor(params: { clientId: string; appointmentId: string; occurredAt: Date }) {
    super({ occurredAt: params.occurredAt, aggregateId: params.clientId });
    this.payload = { clientId: params.clientId, appointmentId: params.appointmentId };
  }
}

export class FreeVisitUsed extends DomainEvent {
  readonly type = 'loyalty.free_visit.used';
  readonly payload: { clientId: string; appointmentId: string };

  constructor(params: { clientId: string; appointmentId: string; occurredAt: Date }) {
    super({ occurredAt: params.occurredAt, aggregateId: params.clientId });
    this.payload = { clientId: params.clientId, appointmentId: params.appointmentId };
  }
}

export class LoyaltyCounterIncremented extends DomainEvent {
  readonly type = 'loyalty.counter.incremented';
  readonly payload: { clientId: string; oldCount: number; newCount: number; appointmentId: string };

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

export class LoyaltyCounterAdjusted extends DomainEvent {
  readonly type = 'loyalty.counter.adjusted';
  readonly payload: {
    clientId: string;
    oldCount: number;
    newCount: number;
    reason: string;
    adjustedBy: string;
  };

  constructor(params: {
    clientId: string;
    oldCount: number;
    newCount: number;
    reason: string;
    adjustedBy: string;
    occurredAt: Date;
  }) {
    super({ occurredAt: params.occurredAt, aggregateId: params.clientId });
    this.payload = {
      clientId: params.clientId,
      oldCount: params.oldCount,
      newCount: params.newCount,
      reason: params.reason,
      adjustedBy: params.adjustedBy,
    };
  }
}

export class LoyaltyTierChanged extends DomainEvent {
  readonly type = 'loyalty.tier.changed';
  readonly payload: {
    clientId: string;
    oldTier: string;
    newTier: string;
    discountPercent: number;
    totalVisits: number;
  };

  constructor(params: {
    clientId: string;
    oldTier: string;
    newTier: string;
    discountPercent: number;
    totalVisits: number;
    occurredAt: Date;
  }) {
    super({ occurredAt: params.occurredAt, aggregateId: params.clientId });
    this.payload = {
      clientId: params.clientId,
      oldTier: params.oldTier,
      newTier: params.newTier,
      discountPercent: params.discountPercent,
      totalVisits: params.totalVisits,
    };
  }
}

export class LoyaltyPointsEarned extends DomainEvent {
  readonly type = 'loyalty.points.earned';
  readonly payload: {
    clientId: string;
    points: number;
    newBalance: number;
    appointmentId?: string;
  };

  constructor(params: {
    clientId: string;
    points: number;
    newBalance: number;
    appointmentId: string | undefined;
    occurredAt: Date;
  }) {
    super({ occurredAt: params.occurredAt, aggregateId: params.clientId });
    this.payload = {
      clientId: params.clientId,
      points: params.points,
      newBalance: params.newBalance,
      ...(params.appointmentId !== undefined ? { appointmentId: params.appointmentId } : {}),
    };
  }
}

export class LoyaltyPointsSpent extends DomainEvent {
  readonly type = 'loyalty.points.spent';
  readonly payload: {
    clientId: string;
    points: number;
    newBalance: number;
    appointmentId?: string;
  };

  constructor(params: {
    clientId: string;
    points: number;
    newBalance: number;
    appointmentId: string | undefined;
    occurredAt: Date;
  }) {
    super({ occurredAt: params.occurredAt, aggregateId: params.clientId });
    this.payload = {
      clientId: params.clientId,
      points: params.points,
      newBalance: params.newBalance,
      ...(params.appointmentId !== undefined ? { appointmentId: params.appointmentId } : {}),
    };
  }
}

export class CashbackEarned extends DomainEvent {
  readonly type = 'loyalty.cashback.earned';
  readonly payload: {
    clientId: string;
    amount: number;
    newBalance: number;
    appointmentId?: string;
  };

  constructor(params: {
    clientId: string;
    amount: number;
    newBalance: number;
    appointmentId: string | undefined;
    occurredAt: Date;
  }) {
    super({ occurredAt: params.occurredAt, aggregateId: params.clientId });
    this.payload = {
      clientId: params.clientId,
      amount: params.amount,
      newBalance: params.newBalance,
      ...(params.appointmentId !== undefined ? { appointmentId: params.appointmentId } : {}),
    };
  }
}

export class CashbackSpent extends DomainEvent {
  readonly type = 'loyalty.cashback.spent';
  readonly payload: {
    clientId: string;
    amount: number;
    newBalance: number;
    appointmentId?: string;
  };

  constructor(params: {
    clientId: string;
    amount: number;
    newBalance: number;
    appointmentId: string | undefined;
    occurredAt: Date;
  }) {
    super({ occurredAt: params.occurredAt, aggregateId: params.clientId });
    this.payload = {
      clientId: params.clientId,
      amount: params.amount,
      newBalance: params.newBalance,
      ...(params.appointmentId !== undefined ? { appointmentId: params.appointmentId } : {}),
    };
  }
}
