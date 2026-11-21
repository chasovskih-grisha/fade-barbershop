import type { LoyaltyRule, LoyaltyTier } from './types';

export const DEFAULT_LOYALTY_RULE: LoyaltyRule = {
  pointsPerDollar: 10,
  tierMultipliers: {
    BRONZE: 1.0,
    SILVER: 1.25,
    GOLD: 1.5,
    PLATINUM: 2.0,
    VIP: 3.0,
  },
  tierThresholds: {
    BRONZE: 0,
    SILVER: 1000,
    GOLD: 5000,
    PLATINUM: 15000,
    VIP: 35000,
  },
  redemptionRateCentsPerPoint: 1,
  birthdayBonusPoints: 500,
  referralBonusPoints: 250,
  streakBonusThreshold: 3,
  streakBonusPoints: 150,
};

export const TIER_UPGRADE_COSTS: Record<LoyaltyTier, number> = {
  BRONZE: 0,
  SILVER: 5000,
  GOLD: 15000,
  PLATINUM: 35000,
  VIP: 75000,
};

export const TIER_RANKS: Record<LoyaltyTier, number> = {
  BRONZE: 0,
  SILVER: 1,
  GOLD: 2,
  PLATINUM: 3,
  VIP: 4,
};

export function calculateTier(
  lifetimePoints: number,
  thresholds: LoyaltyRule['tierThresholds']
): LoyaltyTier {
  if (lifetimePoints >= thresholds.VIP) return 'VIP';
  if (lifetimePoints >= thresholds.PLATINUM) return 'PLATINUM';
  if (lifetimePoints >= thresholds.GOLD) return 'GOLD';
  if (lifetimePoints >= thresholds.SILVER) return 'SILVER';
  return 'BRONZE';
}
