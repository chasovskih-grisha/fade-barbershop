import type { LoyaltyTier, VIPPerkEvaluationInput, VIPPerkEvaluationResult } from './types';

type PerkCore = Omit<VIPPerkEvaluationResult, 'priorityBookingGranted'>;

const PERKS_BY_TIER: Record<LoyaltyTier, PerkCore> = {
  VIP: {
    discountPercent: 15,
    complimentaryUpgradeEligible: true,
    perkDescription: 'VIP 15% off, Priority Booking, Complimentary Beard Trim / Beverage Upgrade.',
  },
  PLATINUM: {
    discountPercent: 10,
    complimentaryUpgradeEligible: true,
    perkDescription: 'Platinum 10% off, Priority Booking, Complimentary Beverage Upgrade.',
  },
  GOLD: {
    discountPercent: 5,
    complimentaryUpgradeEligible: false,
    perkDescription: 'Gold 5% off, Off-peak Priority Booking.',
  },
  SILVER: {
    discountPercent: 0,
    complimentaryUpgradeEligible: false,
    perkDescription: 'Silver tier status active. Earn 1.25x points on all services.',
  },
  BRONZE: {
    discountPercent: 0,
    complimentaryUpgradeEligible: false,
    perkDescription: 'Bronze tier status active.',
  },
};

export function evaluateVipPerks(input: VIPPerkEvaluationInput): VIPPerkEvaluationResult {
  const { account, isPeakHour } = input;
  const perks = PERKS_BY_TIER[account.tier] ?? PERKS_BY_TIER.BRONZE;
  const priorityByTier: Record<LoyaltyTier, boolean> = {
    VIP: true,
    PLATINUM: true,
    GOLD: !isPeakHour,
    SILVER: false,
    BRONZE: false,
  };

  return {
    discountPercent: perks.discountPercent,
    priorityBookingGranted: priorityByTier[account.tier] ?? false,
    complimentaryUpgradeEligible: perks.complimentaryUpgradeEligible,
    perkDescription: perks.perkDescription,
  };
}
