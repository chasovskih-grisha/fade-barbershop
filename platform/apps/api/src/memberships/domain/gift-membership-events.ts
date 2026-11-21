import { DomainEvent } from './domain-event';

export class GiftMembershipPurchasedEvent extends DomainEvent {
  readonly type = 'membership.gift.purchased';

  constructor(
    public readonly payload: {
      giftId: string;
      code: string;
      planId: string;
      purchaserClientId: string;
      recipientEmail?: string;
      expiresAt: Date;
    },
    occurredAt?: Date
  ) {
    super({
      occurredAt: occurredAt ?? new Date(),
      aggregateId: payload.giftId,
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
    occurredAt?: Date
  ) {
    super({
      occurredAt: occurredAt ?? new Date(),
      aggregateId: payload.giftId,
    });
  }
}
