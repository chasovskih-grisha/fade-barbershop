export type AmbassadorTier = 'BRONZE_AMBASSADOR' | 'SILVER_AMBASSADOR' | 'GOLD_AMBASSADOR' | 'DIAMOND_EMISSARY';

export interface AmbassadorProfileEntity {
  id: string;
  clientId: string;
  clientName: string;
  totalSuccessfulReferrals: number;
  currentTier: AmbassadorTier;
  earnedRewards: string[];
  bonusCreditCents: number;
  updatedAt: string;
}

export class AmbassadorBoosterEngine {
  static calculateTierAndRewards(successfulReferrals: number): {
    tier: AmbassadorTier;
    reward: string;
    creditBonusCents: number;
  } {
    if (successfulReferrals >= 10) {
      return {
        tier: 'DIAMOND_EMISSARY',
        reward: 'Lifetime 15% VIP Discount + Private Lounge Access + Custom Scissors Kit',
        creditBonusCents: 10000, // $100 equivalent
      };
    } else if (successfulReferrals >= 5) {
      return {
        tier: 'GOLD_AMBASSADOR',
        reward: 'VIP Styling Kit + 500 Loyalty Points + Free Beard Spa',
        creditBonusCents: 5000, // $50 equivalent
      };
    } else if (successfulReferrals >= 3) {
      return {
        tier: 'SILVER_AMBASSADOR',
        reward: 'Free Haircut Voucher + Priority Weekend Booking',
        creditBonusCents: 2500, // $25 equivalent
      };
    } else {
      return {
        tier: 'BRONZE_AMBASSADOR',
        reward: 'Standard Referral Credit ($10 off next service)',
        creditBonusCents: 1000, // $10 equivalent
      };
    }
  }
}
