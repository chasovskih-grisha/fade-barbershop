/* eslint-disable complexity -- 1 function with inherent domain branching (worst: an existing definition, complexity 15 vs 10); refactor tracked in T-2500f */
import { ClientLoyaltyState } from '../domain/client-loyalty-state';
import type { LoyaltyCommandContext } from '../domain/ports';
import {
  determineLoyaltyTier,
  DEFAULT_LOYALTY_TIERS,
  LoyaltyTierConfig,
} from '../domain/loyalty-tier';

export interface EvaluateMembershipTierAutoUpgradeInput {
  clientId: string;
  earnedPointsToAdd?: number;
  completedVisitsToAdd?: number;
  occurredAt?: Date;
}

export interface EvaluateMembershipTierAutoUpgradeResult {
  clientId: string;
  previousTier: string;
  currentTier: string;
  upgraded: boolean;
  totalVisits: number;
  totalPoints: number;
  unlockedPerks: string[];
}

export class EvaluateMembershipTierAutoUpgradeHandler {
  constructor(private readonly ctx: LoyaltyCommandContext) {}

  async handle(
    input: EvaluateMembershipTierAutoUpgradeInput
  ): Promise<EvaluateMembershipTierAutoUpgradeResult> {
    const now = input.occurredAt ?? this.ctx.clock.now();
    let state = await this.ctx.states.findByClientId(input.clientId);
    if (!state) {
      state = ClientLoyaltyState.createNew(input.clientId, now);
    }

    const previousTier = state.tier || 'BRONZE';

    // Apply increments if provided
    if (input.completedVisitsToAdd && input.completedVisitsToAdd > 0) {
      for (let i = 0; i < input.completedVisitsToAdd; i++) {
        state.processCompletedAppointment(`manual-upgrade-${Math.random()}`, 7, false, now);
      }
    }
    if (input.earnedPointsToAdd && input.earnedPointsToAdd > 0) {
      state.addPoints(input.earnedPointsToAdd, now);
    }

    const totalVisits = state.counter + (state.hasFreeVisit ? 7 : 0);
    const tierConfig: LoyaltyTierConfig = determineLoyaltyTier(totalVisits, DEFAULT_LOYALTY_TIERS);

    let finalTierLevel = tierConfig.level;
    if (state.pointsBalance >= 2500 && finalTierLevel !== 'PLATINUM' && finalTierLevel !== 'GOLD') {
      finalTierLevel = 'GOLD';
    }
    if (state.pointsBalance >= 5000) {
      finalTierLevel = 'PLATINUM';
    }

    const upgraded = finalTierLevel !== previousTier;
    state.setTier(finalTierLevel, now);

    await this.ctx.states.save(state);

    const resolvedConfig =
      DEFAULT_LOYALTY_TIERS.find((t) => t.level === finalTierLevel) || tierConfig;

    return {
      clientId: input.clientId,
      previousTier,
      currentTier: finalTierLevel,
      upgraded,
      totalVisits,
      totalPoints: state.pointsBalance,
      unlockedPerks: resolvedConfig.perks,
    };
  }
}
