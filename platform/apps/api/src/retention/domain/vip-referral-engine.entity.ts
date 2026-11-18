export type VIPTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface VIPReferralRule {
  tier: VIPTier;
  referrerDiscountPercentage: number;
  refereeDiscountPercentage: number;
  bonusPoints: number;
  exclusivePerk?: string;
}

export const VIP_REFERRAL_RULES: Record<VIPTier, VIPReferralRule> = {
  BRONZE: {
    tier: 'BRONZE',
    referrerDiscountPercentage: 10,
    refereeDiscountPercentage: 15,
    bonusPoints: 100,
  },
  SILVER: {
    tier: 'SILVER',
    referrerDiscountPercentage: 15,
    refereeDiscountPercentage: 20,
    bonusPoints: 250,
    exclusivePerk: 'Complimentary Beverage Upgrade',
  },
  GOLD: {
    tier: 'GOLD',
    referrerDiscountPercentage: 20,
    refereeDiscountPercentage: 25,
    bonusPoints: 500,
    exclusivePerk: 'Priority Weekend Booking',
  },
  PLATINUM: {
    tier: 'PLATINUM',
    referrerDiscountPercentage: 25,
    refereeDiscountPercentage: 30,
    bonusPoints: 1000,
    exclusivePerk: 'Free VIP Beard Sculpting & Hot Towel Ritual',
  },
};

export class VIPReferralEngine {
  static calculateReward(tier: VIPTier): VIPReferralRule {
    return VIP_REFERRAL_RULES[tier] || VIP_REFERRAL_RULES.BRONZE;
  }
}
