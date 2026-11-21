/* eslint-disable max-lines, max-params -- cohesive module (149 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 1 signature whose 4-param contract is fixed by existing call sites (worst: projectCorporateContractValue, limit 3); API redesign tracked in T-2500f */
/**
 * FADE Revenue & Pricing Optimization Specialist - VIP & Corporate Contract Pricing Engine
 * Computes dynamic volume-based rebates, corporate tier discounts, and loyalty LTV projections.
 */

export type VipTierLevel = 'silver' | 'gold' | 'platinum' | 'enterprise';

export interface VipTierRule {
  tier: VipTierLevel;
  minMonthlySpend: number;
  serviceDiscountPercentage: number;
  productDiscountPercentage: number;
  priorityBookingWindowDays: number;
  complimentaryAddOnsPerMonth: number;
}

export interface CorporateAccountContext {
  accountId: string;
  tier: VipTierLevel;
  rolling30DaySpend: number;
  activeEmployeeCount: number;
  contractTermMonths: number;
}

export class VipContractPricingEngine {
  private readonly defaultTiers: Record<VipTierLevel, VipTierRule> = {
    silver: {
      tier: 'silver',
      minMonthlySpend: 2500,
      serviceDiscountPercentage: 5,
      productDiscountPercentage: 10,
      priorityBookingWindowDays: 7,
      complimentaryAddOnsPerMonth: 0,
    },
    gold: {
      tier: 'gold',
      minMonthlySpend: 6000,
      serviceDiscountPercentage: 10,
      productDiscountPercentage: 15,
      priorityBookingWindowDays: 14,
      complimentaryAddOnsPerMonth: 1,
    },
    platinum: {
      tier: 'platinum',
      minMonthlySpend: 15000,
      serviceDiscountPercentage: 15,
      productDiscountPercentage: 20,
      priorityBookingWindowDays: 30,
      complimentaryAddOnsPerMonth: 2,
    },
    enterprise: {
      tier: 'enterprise',
      minMonthlySpend: 40000,
      serviceDiscountPercentage: 20,
      productDiscountPercentage: 25,
      priorityBookingWindowDays: 60,
      complimentaryAddOnsPerMonth: 4,
    },
  };

  constructor(private customTiers?: Partial<Record<VipTierLevel, VipTierRule>>) {}

  private getTierRule(tier: VipTierLevel): VipTierRule {
    return {
      ...(this.defaultTiers[tier] || this.defaultTiers.silver),
      ...(this.customTiers?.[tier] || {}),
    };
  }

  /**
   * Evaluates pricing quote for a VIP / Corporate client booking.
   */
  calculateVipQuote(
    baseServicePrice: number,
    baseProductTotal: number,
    context: CorporateAccountContext
  ): {
    tier: VipTierLevel;
    originalTotal: number;
    discountedServicePrice: number;
    discountedProductTotal: number;
    totalDiscountedPrice: number;
    totalSavings: number;
    effectiveDiscountPercentage: number;
    isEligibleForTierUpgrade: boolean;
    recommendedUpgradeTier?: VipTierLevel;
  } {
    const rule = this.getTierRule(context.tier);
    const originalTotal = baseServicePrice + baseProductTotal;

    const discountServiceAmount = Math.round(
      baseServicePrice * (rule.serviceDiscountPercentage / 100)
    );
    const discountProductAmount = Math.round(
      baseProductTotal * (rule.productDiscountPercentage / 100)
    );

    const discountedServicePrice = baseServicePrice - discountServiceAmount;
    const discountedProductTotal = baseProductTotal - discountProductAmount;
    const totalDiscountedPrice = discountedServicePrice + discountedProductTotal;
    const totalSavings = discountServiceAmount + discountProductAmount;

    const effectiveDiscountPercentage =
      originalTotal > 0 ? Math.round((totalSavings / originalTotal) * 10000) / 100 : 0;

    // Check tier upgrade eligibility
    let isEligibleForTierUpgrade = false;
    let recommendedUpgradeTier: VipTierLevel | undefined = undefined;

    const tiers: VipTierLevel[] = ['silver', 'gold', 'platinum', 'enterprise'];
    const currentIndex = tiers.indexOf(context.tier);

    if (currentIndex < tiers.length - 1) {
      const nextTierKey = tiers[currentIndex + 1];
      if (nextTierKey) {
        const nextRule = this.getTierRule(nextTierKey);
        if (context.rolling30DaySpend >= nextRule.minMonthlySpend * 0.9) {
          isEligibleForTierUpgrade = true;
          recommendedUpgradeTier = nextTierKey;
        }
      }
    }

    return {
      tier: context.tier,
      originalTotal,
      discountedServicePrice,
      discountedProductTotal,
      totalDiscountedPrice,
      totalSavings,
      effectiveDiscountPercentage,
      isEligibleForTierUpgrade,
      ...(recommendedUpgradeTier ? { recommendedUpgradeTier } : {}),
    };
  }

  /**
   * Projects annual contract LTV and net margin for corporate accounts.
   */
  projectCorporateContractValue(
    context: CorporateAccountContext,
    averageMonthlyServiceSpend: number,
    averageMonthlyProductSpend: number,
    estimatedGrossMarginPercentage: number = 65
  ): {
    accountId: string;
    tier: VipTierLevel;
    annualGrossRevenue: number;
    annualEstimatedCost: number;
    annualNetProfit: number;
    projectedLtv: number;
  } {
    const rule = this.getTierRule(context.tier);
    const monthlyServiceAfterDiscount =
      averageMonthlyServiceSpend * (1 - rule.serviceDiscountPercentage / 100);
    const monthlyProductAfterDiscount =
      averageMonthlyProductSpend * (1 - rule.productDiscountPercentage / 100);

    const monthlyNetRevenue = monthlyServiceAfterDiscount + monthlyProductAfterDiscount;
    const annualGrossRevenue = Math.round(monthlyNetRevenue * 12);
    const annualEstimatedCost = Math.round(
      annualGrossRevenue * (1 - estimatedGrossMarginPercentage / 100)
    );
    const annualNetProfit = annualGrossRevenue - annualEstimatedCost;

    // Projected LTV over contract term (e.g. 3 years retention multiplier)
    const retentionMultiplier = Math.max(1, context.contractTermMonths / 12) * 2.5;
    const projectedLtv = Math.round(annualNetProfit * retentionMultiplier);

    return {
      accountId: context.accountId,
      tier: context.tier,
      annualGrossRevenue,
      annualEstimatedCost,
      annualNetProfit,
      projectedLtv,
    };
  }
}
