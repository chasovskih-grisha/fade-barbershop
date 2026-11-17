import { ClientLoyaltyState } from '../domain/client-loyalty-state';
import type { LoyaltyCommandContext } from '../domain/ports';
import { LoyaltyPointsEarned, CashbackEarned } from '../domain/loyalty-events';

export interface ApplyReferralLoyaltyBonusInput {
  referrerClientId: string;
  refereeClientId: string;
  bonusPoints?: number;
  bonusCashback?: number;
  occurredAt?: Date;
}

export interface ApplyReferralLoyaltyBonusResult {
  referrerClientId: string;
  refereeClientId: string;
  referrerNewPointsBalance: number;
  refereeNewPointsBalance: number;
  referrerNewCashbackBalance: number;
  refereeNewCashbackBalance: number;
  pointsAwarded: number;
  cashbackAwarded: number;
}

export class ApplyReferralLoyaltyBonusHandler {
  constructor(private readonly ctx: LoyaltyCommandContext) {}

  async handle(input: ApplyReferralLoyaltyBonusInput): Promise<ApplyReferralLoyaltyBonusResult> {
    const now = input.occurredAt ?? this.ctx.clock.now();
    const pointsAwarded = input.bonusPoints ?? 500; // default 500 referral points
    const cashbackAwarded = input.bonusCashback ?? 150; // default 150 UAH cashback

    // 1. Process referrer
    let referrerState = await this.ctx.states.findByClientId(input.referrerClientId);
    if (!referrerState) {
      referrerState = ClientLoyaltyState.createNew(input.referrerClientId, now);
    }
    referrerState.addPoints(pointsAwarded, now);
    referrerState.addCashback(cashbackAwarded, now);
    await this.ctx.states.save(referrerState);

    // 2. Process referee (welcome referral bonus)
    let refereeState = await this.ctx.states.findByClientId(input.refereeClientId);
    if (!refereeState) {
      refereeState = ClientLoyaltyState.createNew(input.refereeClientId, now);
    }
    const refereeWelcomePoints = Math.round(pointsAwarded / 2); // 250 welcome points
    refereeState.addPoints(refereeWelcomePoints, now);
    await this.ctx.states.save(refereeState);

    // 3. Outbox events
    await this.ctx.outbox.append([
      new LoyaltyPointsEarned({
        clientId: input.referrerClientId,
        points: pointsAwarded,
        newBalance: referrerState.pointsBalance,
        appointmentId: undefined,
        occurredAt: now,
      }),
      new CashbackEarned({
        clientId: input.referrerClientId,
        amount: cashbackAwarded,
        newBalance: referrerState.cashbackBalance,
        appointmentId: undefined,
        occurredAt: now,
      }),
      new LoyaltyPointsEarned({
        clientId: input.refereeClientId,
        points: refereeWelcomePoints,
        newBalance: refereeState.pointsBalance,
        appointmentId: undefined,
        occurredAt: now,
      }),
    ]);

    return {
      referrerClientId: input.referrerClientId,
      refereeClientId: input.refereeClientId,
      referrerNewPointsBalance: referrerState.pointsBalance,
      refereeNewPointsBalance: refereeState.pointsBalance,
      referrerNewCashbackBalance: referrerState.cashbackBalance,
      refereeNewCashbackBalance: refereeState.cashbackBalance,
      pointsAwarded,
      cashbackAwarded,
    };
  }
}
