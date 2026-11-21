import type { ClientRetentionProfile, RetentionProfileInput } from './types';

export interface RecommendedActionContext {
  totalVisits: number;
  lastVisitDaysAgo: number;
  churnRiskScore: number;
  tier: ClientRetentionProfile['tier'];
}

/**
 * Estimates churn risk from visit recency. Lifetime spend is kept in the signature
 * so callers can pass a complete retention snapshot without branching at the call site.
 */
export function calculateChurnRisk(
  totalVisits: number,
  lastVisitDaysAgo: number,
  _lifetimeSpendUah: number
): number {
  if (totalVisits === 1 && lastVisitDaysAgo > 21) return 0.85;
  if (lastVisitDaysAgo > 60) return 0.9;
  if (lastVisitDaysAgo > 45) return 0.65;
  if (lastVisitDaysAgo > 30) return 0.4;
  return 0.1;
}

export function resolveTier(
  totalVisits: number,
  lifetimeSpendUah: number
): ClientRetentionProfile['tier'] {
  if (lifetimeSpendUah >= 5000 || totalVisits >= 10) return 'platinum';
  if (lifetimeSpendUah >= 2500 || totalVisits >= 5) return 'gold';
  if (lifetimeSpendUah >= 1000 || totalVisits >= 3) return 'silver';
  return 'bronze';
}

export function resolveRecommendedAction(
  context: RecommendedActionContext
): ClientRetentionProfile['recommendedAction'] {
  const { totalVisits, lastVisitDaysAgo, churnRiskScore, tier } = context;
  if (totalVisits === 1 && lastVisitDaysAgo >= 14 && lastVisitDaysAgo <= 30) {
    return 'onboarding_nudge';
  }
  if (churnRiskScore >= 0.65) return 'winback_discount';
  if (totalVisits >= 2 && churnRiskScore < 0.3) return 'referral_invite';
  if (tier === 'platinum' || tier === 'gold') return 'vip_reward';
  return 'none';
}

export function evaluateRetentionProfile(input: RetentionProfileInput): ClientRetentionProfile {
  const { clientId, totalVisits, lastVisitDaysAgo, lifetimeSpendUah } = input;
  const churnRiskScore = calculateChurnRisk(totalVisits, lastVisitDaysAgo, lifetimeSpendUah);
  const tier = resolveTier(totalVisits, lifetimeSpendUah);
  const recommendedAction = resolveRecommendedAction({
    totalVisits,
    lastVisitDaysAgo,
    churnRiskScore,
    tier,
  });

  return {
    clientId,
    totalVisits,
    lastVisitDaysAgo,
    lifetimeSpendUah,
    tier,
    churnRiskScore,
    recommendedAction,
  };
}
