import { DomainEvent } from './domain-event'; // Or general domain event interface

export class MembershipPurchasedEvent extends DomainEvent {
  readonly type = 'membership.purchased';

  constructor(
    public readonly payload: {
      membershipId: string;
      clientId: string;
      planId: string;
      startDate: Date;
      endDate: Date;
      visitLimit: number;
    },
    occurredAt?: Date,
  ) {
    super({
      occurredAt: occurredAt ?? new Date(),
      aggregateId: payload.membershipId,
    });
  }
}

export class MembershipVisitUsedEvent extends DomainEvent {
  readonly type = 'membership.visit_used';

  constructor(
    public readonly payload: {
      membershipId: string;
      clientId: string;
      remainingVisits: number;
    },
    occurredAt?: Date,
  ) {
    super({
      occurredAt: occurredAt ?? new Date(),
      aggregateId: payload.membershipId,
    });
  }
}

export class MembershipPausedEvent extends DomainEvent {
  readonly type = 'membership.paused';

  constructor(
    public readonly payload: {
      membershipId: string;
      clientId: string;
      pausedAt: Date;
    },
    occurredAt?: Date,
  ) {
    super({
      occurredAt: occurredAt ?? new Date(),
      aggregateId: payload.membershipId,
    });
  }
}

export class MembershipResumedEvent extends DomainEvent {
  readonly type = 'membership.resumed';

  constructor(
    public readonly payload: {
      membershipId: string;
      clientId: string;
      resumedAt: Date;
      newEndDate: Date;
    },
    occurredAt?: Date,
  ) {
    super({
      occurredAt: occurredAt ?? new Date(),
      aggregateId: payload.membershipId,
    });
  }
}

export class GiftMembershipRedeemedEvent extends DomainEvent {
  readonly type = 'membership.gift.redeemed';

  constructor(
    public readonly payload: {
      giftId: string;
      code: string;
      planId: string;
      redeemedByClientId: string;
      membershipInstanceId: string;
    },
    occurredAt?: Date,
  ) {
    super({
      occurredAt: occurredAt ?? new Date(),
      aggregateId: payload.giftId,
    });
  }
}
