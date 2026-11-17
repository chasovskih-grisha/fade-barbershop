import { ClientLoyaltyState } from '../domain/client-loyalty-state';
import type { LoyaltyCommandContext } from '../domain/ports';
import { determineLoyaltyTier, DEFAULT_LOYALTY_TIERS, LoyaltyTierConfig } from '../domain/loyalty-tier';

export interface EvaluateMembershipPerksInput {
  clientId: string;
  hasActiveMembership: boolean;
  membershipPlanName?: string;
  isAnniversaryOrBirthday?: boolean;
  basePointsEarnable: number;
  occurredAt?: Date;
}

export interface EvaluateMembershipPerksResult {
  clientId: string;
  tier: string;
  pointsMultiplier: number;
  finalPointsEarnable: number;
  appliedPerks: string[];
  membershipBoostActive: boolean;
}

export class EvaluateMembershipPerksHandler {
  constructor(private readonly ctx: LoyaltyCommandContext) {}

  async handle(input: EvaluateMembershipPerksInput): Promise<EvaluateMembershipPerksResult> {
    const now = input.occurredAt ?? this.ctx.clock.now();
    let state = await this.ctx.states.findByClientId(input.clientId);
    if (!state) {
      state = ClientLoyaltyState.createNew(input.clientId, now);
    }

    const totalVisits = state.counter + (state.hasFreeVisit ? 6 : 0);
    const tierConfig: LoyaltyTierConfig = determineLoyaltyTier(totalVisits, DEFAULT_LOYALTY_TIERS);
    const currentTierName = state.tier || tierConfig.level;
    const resolvedTier = DEFAULT_LOYALTY_TIERS.find((t) => t.level === currentTierName) || tierConfig;

    let multiplier = 1.0;
    if (resolvedTier.level === 'SILVER') multiplier = 1.25;
    if (resolvedTier.level === 'GOLD') multiplier = 1.5;
    if (resolvedTier.level === 'PLATINUM') multiplier = 2.0;

    if (input.hasActiveMembership) {
      multiplier += 0.5; // active membership boost
    }

    if (input.isAnniversaryOrBirthday) {
      multiplier *= 2.0; // birthday/anniversary double points multiplier
    }

    const finalPointsEarnable = Math.max(1, Math.round(input.basePointsEarnable * multiplier));
    const appliedPerks = [...resolvedTier.perks];
    if (input.hasActiveMembership) {
      appliedPerks.push(`Active Membership Perk: ${input.membershipPlanName ?? 'VIP Membership'} (+0.5x points boost, priority booking)`);
    }
    if (input.isAnniversaryOrBirthday) {
      appliedPerks.push('Birthday/Anniversary Bonus: 2x Points Multiplier Active');
    }

    return {
      clientId: input.clientId,
      tier: resolvedTier.level,
      pointsMultiplier: Number(multiplier.toFixed(2)),
      finalPointsEarnable,
      appliedPerks,
      membershipBoostActive: input.hasActiveMembership,
    };
  }
}
