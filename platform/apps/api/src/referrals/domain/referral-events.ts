import { DomainEvent } from '../../shared/domain/domain-event';

export class ReferralSignupAttributed extends DomainEvent {
  readonly type = 'referral_signup_attributed';
  constructor(
    public readonly payload: {
      refereeId: string;
      referrerId: string;
      referralCode: string;
      occurredAt: Date;
    }
  ) {
    super({ occurredAt: payload.occurredAt, aggregateId: payload.refereeId });
  }
}

export class ReferralRewardEarned extends DomainEvent {
  readonly type = 'referral_reward_earned';
  constructor(
    public readonly payload: {
      referrerId: string;
      refereeId: string;
      rewardType: string;
      occurredAt: Date;
    }
  ) {
    super({ occurredAt: payload.occurredAt, aggregateId: payload.referrerId });
  }
}
