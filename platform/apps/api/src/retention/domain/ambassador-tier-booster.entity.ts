export type AmbassadorTier =
  'AMBASSADOR_BRONZE' | 'AMBASSADOR_SILVER' | 'AMBASSADOR_GOLD' | 'AMBASSADOR_ELITE';

export interface AmbassadorTierRule {
  tier: AmbassadorTier;
  requiredReferrals: number;
  serviceDiscountPercentage: number;
  bonusPointsAward: number;
  perks: string[];
}

export const AMBASSADOR_TIER_RULES: Record<AmbassadorTier, AmbassadorTierRule> = {
  AMBASSADOR_BRONZE: {
    tier: 'AMBASSADOR_BRONZE',
    requiredReferrals: 1,
    serviceDiscountPercentage: 10,
    bonusPointsAward: 200,
    perks: ['10% Off Next Haircut', 'Referral Badge on Profile'],
  },
  AMBASSADOR_SILVER: {
    tier: 'AMBASSADOR_SILVER',
    requiredReferrals: 3,
    serviceDiscountPercentage: 15,
    bonusPointsAward: 500,
    perks: ['15% Off All Services', 'Complimentary Beard Trim Upgrade', 'Priority SMS Booking'],
  },
  AMBASSADOR_GOLD: {
    tier: 'AMBASSADOR_GOLD',
    requiredReferrals: 5,
    serviceDiscountPercentage: 20,
    bonusPointsAward: 1000,
    perks: [
      '20% Off All Services',
      'Complimentary Whiskey & Beverage Bar',
      'Dedicated Barber Chair Guarantee',
    ],
  },
  AMBASSADOR_ELITE: {
    tier: 'AMBASSADOR_ELITE',
    requiredReferrals: 10,
    serviceDiscountPercentage: 25,
    bonusPointsAward: 2500,
    perks: [
      '25% Off Lifetime',
      'Free VIP Grooming Kit',
      'Unlimited Priority Weekend Slots',
      'Private Lounge Access',
    ],
  },
};

export class AmbassadorTierEngine {
  static evaluateTier(referralCount: number): AmbassadorTierRule {
    if (referralCount >= 10) return AMBASSADOR_TIER_RULES.AMBASSADOR_ELITE;
    if (referralCount >= 5) return AMBASSADOR_TIER_RULES.AMBASSADOR_GOLD;
    if (referralCount >= 3) return AMBASSADOR_TIER_RULES.AMBASSADOR_SILVER;
    if (referralCount >= 1) return AMBASSADOR_TIER_RULES.AMBASSADOR_BRONZE;
    return AMBASSADOR_TIER_RULES.AMBASSADOR_BRONZE;
  }
}
