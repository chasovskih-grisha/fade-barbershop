/* eslint-disable max-params -- 1 signature whose 8-param contract is fixed by existing call sites (worst: an existing definition, limit 3); API redesign tracked in T-2500f */
export type ReferralStatus = 'pending' | 'completed' | 'rewarded' | 'revoked';

export interface ReferralRecord {
  refereeId: string;
  referrerId: string;
  referralCode: string;
  status: ReferralStatus;
  attributedAt: Date;
  completedAt?: Date;
  rewardEarnedAt?: Date;
  revocationReason?: string;
}

export class ReferralState {
  constructor(
    public readonly refereeId: string,
    public readonly referrerId: string,
    public readonly referralCode: string,
    public status: ReferralStatus,
    public readonly attributedAt: Date,
    public completedAt?: Date,
    public rewardEarnedAt?: Date,
    public revocationReason?: string
  ) {}

  static createAttribution(input: {
    refereeId: string;
    referrerId: string;
    referralCode: string;
    attributedAt: Date;
  }): ReferralState {
    if (input.refereeId === input.referrerId) {
      throw new Error('Self-referral is prohibited');
    }
    return new ReferralState(
      input.refereeId,
      input.referrerId,
      input.referralCode,
      'pending',
      input.attributedAt
    );
  }

  completeRefereeVisit(occurredAt: Date): { rewarded: boolean } {
    if (this.status !== 'pending') {
      return { rewarded: false };
    }
    this.completedAt = occurredAt;
    this.status = 'completed';
    this.rewardEarnedAt = occurredAt;
    this.status = 'rewarded';
    return { rewarded: true };
  }

  revoke(reason: string, _occurredAt: Date): void {
    this.status = 'revoked';
    this.revocationReason = reason;
  }
}
