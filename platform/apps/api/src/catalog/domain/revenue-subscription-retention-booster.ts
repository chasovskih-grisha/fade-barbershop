/**
 * FADE Revenue Subscription & Retention Booster Module
 * Optimizes member retention pricing, LTV multipliers, and churn reduction incentives.
 */

export interface MemberRetentionTier {
  tierName: string;
  monthsSubscribed: number;
  retentionDiscountPercentage: number; // e.g. 5% discount for 6+ months, 10% for 12+ months
  priorityBookingWindowHours: number; // e.g. 48 hours early access
}

export class RevenueSubscriptionRetentionBooster {
  constructor(private readonly tiers: MemberRetentionTier[] = [
    { tierName: 'Silver Member', monthsSubscribed: 3, retentionDiscountPercentage: 5, priorityBookingWindowHours: 24 },
    { tierName: 'Gold Member', monthsSubscribed: 6, retentionDiscountPercentage: 10, priorityBookingWindowHours: 48 },
    { tierName: 'Black Diamond Member', monthsSubscribed: 12, retentionDiscountPercentage: 15, priorityBookingWindowHours: 72 },
  ]) {}

  evaluateRetentionTier(monthsSubscribed: number): MemberRetentionTier | null {
    const sorted = [...this.tiers].sort((a, b) => b.monthsSubscribed - a.monthsSubscribed);
    for (const tier of sorted) {
      if (monthsSubscribed >= tier.monthsSubscribed) {
        return tier;
      }
    }
    return null;
  }

  calculateRetainedMemberValue(
    baseMonthlyFee: number,
    monthsSubscribed: number,
    baselineChurnRate: number = 0.08
  ): {
    tierName: string | null;
    adjustedMonthlyFee: number;
    effectiveDiscountPercentage: number;
    priorityBookingWindowHours: number;
    projectedLTVUplift: number;
  } {
    const tier = this.evaluateRetentionTier(monthsSubscribed);
    const discount = tier ? tier.retentionDiscountPercentage : 0;
    const adjustedMonthlyFee = Math.round(baseMonthlyFee * (1 - discount / 100));
    const priorityBookingWindowHours = tier ? tier.priorityBookingWindowHours : 0;

    // Projected LTV calculation with reduced churn for higher loyalty tiers
    const churnReduction = tier ? (tier.monthsSubscribed >= 12 ? 0.04 : tier.monthsSubscribed >= 6 ? 0.025 : 0.01) : 0;
    const adjustedChurn = Math.max(0.01, baselineChurnRate - churnReduction);
    const projectedLifetimeMonths = 1 / adjustedChurn;
    const projectedLTVUplift = Math.round(adjustedMonthlyFee * projectedLifetimeMonths);

    return {
      tierName: tier ? tier.tierName : null,
      adjustedMonthlyFee,
      effectiveDiscountPercentage: discount,
      priorityBookingWindowHours,
      projectedLTVUplift,
    };
  }
}
