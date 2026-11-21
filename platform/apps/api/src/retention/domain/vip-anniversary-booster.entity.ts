export type VipTier = 'SILVER' | 'GOLD' | 'PLATINUM' | 'BLACK';

export interface VipTierRule {
  tier: VipTier;
  minLifetimeSpendUah: number;
  minCompletedVisits: number;
  discountPercentage: number;
  complimentaryPerks: string[];
  priorityBookingWindowHours: number;
}

export const VIP_TIER_RULES: Record<VipTier, VipTierRule> = {
  SILVER: {
    tier: 'SILVER',
    minLifetimeSpendUah: 3000,
    minCompletedVisits: 5,
    discountPercentage: 5,
    complimentaryPerks: ['Complimentary Beverage', 'Priority SMS Reminders'],
    priorityBookingWindowHours: 24,
  },
  GOLD: {
    tier: 'GOLD',
    minLifetimeSpendUah: 7500,
    minCompletedVisits: 12,
    discountPercentage: 10,
    complimentaryPerks: [
      'Complimentary Styling Product',
      'Free Beard Trim Upgrade / Year',
      'Priority Booking',
    ],
    priorityBookingWindowHours: 48,
  },
  PLATINUM: {
    tier: 'PLATINUM',
    minLifetimeSpendUah: 15000,
    minCompletedVisits: 25,
    discountPercentage: 15,
    complimentaryPerks: [
      'Free Haircut Upgrade',
      'Complimentary Premium Pomade',
      'VIP Lounge Access',
    ],
    priorityBookingWindowHours: 72,
  },
  BLACK: {
    tier: 'BLACK',
    minLifetimeSpendUah: 30000,
    minCompletedVisits: 50,
    discountPercentage: 20,
    complimentaryPerks: [
      'Unlimited Hot Towel Shaves',
      'Concierge Booking',
      'Exclusive Member Events',
    ],
    priorityBookingWindowHours: 168,
  },
};

export class VipAnniversaryBooster {
  static evaluateVipTier(lifetimeSpendUah: number, completedVisits: number): VipTierRule {
    if (lifetimeSpendUah >= 30000 || completedVisits >= 50) {
      return VIP_TIER_RULES.BLACK;
    }
    if (lifetimeSpendUah >= 15000 || completedVisits >= 25) {
      return VIP_TIER_RULES.PLATINUM;
    }
    if (lifetimeSpendUah >= 7500 || completedVisits >= 12) {
      return VIP_TIER_RULES.GOLD;
    }
    return VIP_TIER_RULES.SILVER;
  }

  static generateAnniversaryMessage(
    clientName: string,
    yearsActive: number,
    tier: VipTier
  ): { discountPercentage: number; message: string } {
    const tierRule = VIP_TIER_RULES[tier];
    const discount = tierRule.discountPercentage + 5; // Anniversary bonus boost
    const perksText = tierRule.complimentaryPerks.join(', ');
    const message = `Happy ${yearsActive}-Year FADE Anniversary, ${clientName}! As our valued ${tier} member, enjoy ${discount}% off your next fresh cut and exclusive anniversary perks (${perksText}). Book today!`;
    return { discountPercentage: discount, message };
  }
}
