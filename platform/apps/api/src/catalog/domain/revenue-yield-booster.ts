/* eslint-disable max-lines, complexity -- cohesive module (266 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 1 function with inherent domain branching (worst: calculatePeakDemandYieldAndLoyaltyRebate, complexity 17 vs 10); refactor tracked in T-2500f */
/**
 * FADE Revenue & Pricing Optimization Specialist - Advanced Revenue Yield Booster
 * Implements dynamic barber tier scarcity pricing, multi-service cross-sell uplift optimization,
 * and high-margin add-on bundle packaging.
 */

export interface BarberTierDemandContext {
  tier: 'junior' | 'standard' | 'senior' | 'master';
  availableCapacitySlots: number;
  totalCapacitySlots: number;
  historicalDemandScore: number; // 0 to 1
}

export interface CrossSellItem {
  serviceId: string;
  basePrice: number;
  category: 'grooming' | 'styling' | 'skincare' | 'maintenance';
  marginScore: number; // 0 to 1 (higher = more profitable)
  historicalAttachRate: number; // 0 to 1
}

export interface SmartCartItem {
  itemId: string;
  basePrice: number;
  isAddOn: boolean;
  marginScore: number;
}

export interface PeakDemandPricingContext {
  basePrice: number;
  dayOfWeek: number; // 0 (Sun) to 6 (Sat)
  hourOfDay: number; // 0 to 23
  clientLoyaltyTier: 'none' | 'silver' | 'gold' | 'platinum';
  marginScore: number; // 0 to 1
}

export interface PeakDemandPricingResult {
  basePrice: number;
  peakSurgeMultiplier: number;
  surgeAdjustedPrice: number;
  loyaltyRebatePercentage: number;
  loyaltyRebateAmount: number;
  finalOptimizedPrice: number;
  effectiveMarginPercentage: number;
  isPeakPeriod: boolean;
  isMarginCompliant: boolean;
}

export class RevenueYieldBooster {
  /**
   * Computes dynamic scarcity multiplier for barber experience tiers based on remaining capacity.
   * When master/senior barber availability is low (< 20% capacity), applies scarcity yield multiplier.
   */
  calculateBarberScarcityMultiplier(context: BarberTierDemandContext): {
    scarcityMultiplier: number;
    utilizationRate: number;
    isHighDemand: boolean;
  } {
    const utilizationRate =
      context.totalCapacitySlots > 0
        ? 1 - context.availableCapacitySlots / context.totalCapacitySlots
        : 0;

    let scarcityMultiplier = 1.0;
    let isHighDemand = false;

    if (utilizationRate >= 0.85 || context.historicalDemandScore >= 0.9) {
      isHighDemand = true;
      if (context.tier === 'master') {
        scarcityMultiplier = 1.25; // +25% scarcity premium for master
      } else if (context.tier === 'senior') {
        scarcityMultiplier = 1.15; // +15% for senior
      } else {
        scarcityMultiplier = 1.08; // +8% for standard/junior
      }
    } else if (utilizationRate >= 0.7) {
      isHighDemand = true;
      if (context.tier === 'master') {
        scarcityMultiplier = 1.15;
      } else if (context.tier === 'senior') {
        scarcityMultiplier = 1.1;
      }
    }

    return {
      scarcityMultiplier,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      isHighDemand,
    };
  }

  /**
   * Optimizes cross-sell recommendations for cart items to maximize margin and revenue uplift.
   * Ranks available cross-sell candidates by a composite score of affinity, margin, and attach rate.
   */
  optimizeCrossSellRecommendations(
    primaryServiceId: string,
    candidates: CrossSellItem[],
    maxRecommendations: number = 3
  ): {
    recommendedServiceIds: string[];
    compositeScores: Record<string, number>;
    estimatedRevenueUplift: number;
  } {
    const scoredCandidates = candidates.map((item) => {
      // Composite score = 40% margin score + 40% historical attach rate + 20% baseline weight
      const score = item.marginScore * 0.4 + item.historicalAttachRate * 0.4 + 0.2;
      return {
        ...item,
        score: Math.round(score * 100) / 100,
      };
    });

    scoredCandidates.sort((a, b) => b.score - a.score);
    const top = scoredCandidates.slice(0, maxRecommendations);

    const recommendedServiceIds = top.map((t) => t.serviceId);
    const compositeScores: Record<string, number> = {};
    let estimatedRevenueUplift = 0;

    for (const item of top) {
      compositeScores[item.serviceId] = item.score;
      // Estimated uplift = basePrice * attachRate * marginScore
      estimatedRevenueUplift += Math.round(
        item.basePrice * item.historicalAttachRate * item.marginScore
      );
    }

    return {
      recommendedServiceIds,
      compositeScores,
      estimatedRevenueUplift,
    };
  }

  /**
   * Calculates dynamic promotional bundling price with margin guardrails.
   */
  calculatePromotionalBundleYield(
    basePrices: number[],
    targetDiscountPercentage: number,
    minAllowedMarginPercentage: number = 35
  ): {
    totalBasePrice: number;
    optimizedBundlePrice: number;
    actualDiscountPercentage: number;
    isMarginCompliant: boolean;
  } {
    const totalBasePrice = basePrices.reduce((acc, p) => acc + p, 0);
    const rawDiscountedPrice = Math.round(totalBasePrice * (1 - targetDiscountPercentage / 100));

    // Assume cost is 40% of base price on average
    const estimatedCost = totalBasePrice * 0.4;
    const actualMarginPercentage =
      totalBasePrice > 0 ? ((rawDiscountedPrice - estimatedCost) / rawDiscountedPrice) * 100 : 0;

    let optimizedBundlePrice = rawDiscountedPrice;
    let actualDiscountPercentage = targetDiscountPercentage;
    let isMarginCompliant = actualMarginPercentage >= minAllowedMarginPercentage;

    if (!isMarginCompliant) {
      // Recalculate max allowable discount to maintain min margin
      const minPrice = estimatedCost / (1 - minAllowedMarginPercentage / 100);
      optimizedBundlePrice = Math.ceil(minPrice);
      actualDiscountPercentage = Math.round((1 - optimizedBundlePrice / totalBasePrice) * 100);
      isMarginCompliant = true;
    }

    return {
      totalBasePrice,
      optimizedBundlePrice,
      actualDiscountPercentage,
      isMarginCompliant,
    };
  }

  /**
   * Calculates smart cart add-on attach rate incentive and progressive discounting
   * to maximize Average Order Value (AOV) while safeguarding gross margins.
   */
  calculateSmartCartAttachIncentive(
    cartItems: { itemId: string; basePrice: number; isAddOn: boolean; marginScore: number }[],
    minAllowedMarginPercentage: number = 40
  ): {
    primaryItemCount: number;
    addOnItemCount: number;
    currentAttachRate: number;
    appliedDiscountPercentage: number;
    originalCartTotal: number;
    discountedCartTotal: number;
    totalSavings: number;
    estimatedAovUplift: number;
    isMarginCompliant: boolean;
  } {
    const primaries = cartItems.filter((item) => !item.isAddOn);
    const addOns = cartItems.filter((item) => item.isAddOn);

    const primaryItemCount = primaries.length;
    const addOnItemCount = addOns.length;
    const currentAttachRate =
      primaryItemCount > 0 ? Number((addOnItemCount / primaryItemCount).toFixed(2)) : 0;

    const originalPrimaryTotal = primaries.reduce((acc, item) => acc + item.basePrice, 0);
    const originalAddOnTotal = addOns.reduce((acc, item) => acc + item.basePrice, 0);
    const originalCartTotal = originalPrimaryTotal + originalAddOnTotal;

    // Progressive discount for add-ons based on quantity attached
    let appliedDiscountPercentage = 0;
    if (addOnItemCount >= 3) {
      appliedDiscountPercentage = 15;
    } else if (addOnItemCount === 2) {
      appliedDiscountPercentage = 10;
    } else if (addOnItemCount === 1) {
      appliedDiscountPercentage = 5;
    }

    const discountAddOnAmount = Math.round((originalAddOnTotal * appliedDiscountPercentage) / 100);
    const discountedAddOnTotal = originalAddOnTotal - discountAddOnAmount;
    const discountedCartTotal = originalPrimaryTotal + discountedAddOnTotal;

    // Estimate gross margin compliance
    const estimatedCost = cartItems.reduce(
      (acc, item) => acc + item.basePrice * (1 - item.marginScore * 0.7),
      0
    );
    const actualMarginPercentage =
      discountedCartTotal > 0
        ? ((discountedCartTotal - estimatedCost) / discountedCartTotal) * 100
        : 0;

    let isMarginCompliant = actualMarginPercentage >= minAllowedMarginPercentage;
    let finalDiscountPercentage = appliedDiscountPercentage;

    if (!isMarginCompliant) {
      // Reduce discount to match min margin requirement
      const maxDiscountedTotal = estimatedCost / (1 - minAllowedMarginPercentage / 100);
      const maxAllowedSavings = Math.max(0, originalCartTotal - Math.ceil(maxDiscountedTotal));
      const adjustedDiscountAddOnAmount = Math.min(discountAddOnAmount, maxAllowedSavings);
      finalDiscountPercentage =
        originalAddOnTotal > 0
          ? Math.round((adjustedDiscountAddOnAmount / originalAddOnTotal) * 100)
          : 0;
      isMarginCompliant = true;
    }

    const finalDiscountAmount = Math.round((originalAddOnTotal * finalDiscountPercentage) / 100);
    const finalDiscountedCartTotal = originalCartTotal - finalDiscountAmount;
    const estimatedAovUplift = originalAddOnTotal > 0 ? Math.round(originalAddOnTotal * 0.25) : 0;

    return {
      primaryItemCount,
      addOnItemCount,
      currentAttachRate,
      appliedDiscountPercentage: finalDiscountPercentage,
      originalCartTotal,
      discountedCartTotal: finalDiscountedCartTotal,
      totalSavings: finalDiscountAmount,
      estimatedAovUplift,
      isMarginCompliant,
    };
  }

  /**
   * Calculates peak demand surge pricing combined with VIP loyalty tier rebates
   * while enforcing strict gross margin guardrails.
   */
  calculatePeakDemandYieldAndLoyaltyRebate(
    context: PeakDemandPricingContext,
    minAllowedMarginPercentage: number = 35
  ): PeakDemandPricingResult {
    // Peak hours: Fri (5) or Sat (6) 14:00-20:00, or Mon-Thu (1-4) 17:00-20:00
    const isWeekendPeak =
      (context.dayOfWeek === 5 || context.dayOfWeek === 6) &&
      context.hourOfDay >= 14 &&
      context.hourOfDay <= 20;
    const isWeekdayPeak =
      context.dayOfWeek >= 1 &&
      context.dayOfWeek <= 4 &&
      context.hourOfDay >= 17 &&
      context.hourOfDay <= 20;
    const isPeakPeriod = isWeekendPeak || isWeekdayPeak;

    const peakSurgeMultiplier = isPeakPeriod ? 1.15 : 1.0;
    const surgeAdjustedPrice = Math.round(context.basePrice * peakSurgeMultiplier);

    let loyaltyRebatePercentage = 0;
    if (context.clientLoyaltyTier === 'platinum') {
      loyaltyRebatePercentage = 10;
    } else if (context.clientLoyaltyTier === 'gold') {
      loyaltyRebatePercentage = 7;
    } else if (context.clientLoyaltyTier === 'silver') {
      loyaltyRebatePercentage = 4;
    }

    const rawRebateAmount = Math.round((surgeAdjustedPrice * loyaltyRebatePercentage) / 100);
    let finalOptimizedPrice = surgeAdjustedPrice - rawRebateAmount;

    // Estimate cost and check margin floor
    const estimatedCost = context.basePrice * (1 - context.marginScore * 0.7);
    const actualMarginPercentage =
      finalOptimizedPrice > 0
        ? ((finalOptimizedPrice - estimatedCost) / finalOptimizedPrice) * 100
        : 0;

    let isMarginCompliant = actualMarginPercentage >= minAllowedMarginPercentage;
    let finalRebatePercentage = loyaltyRebatePercentage;
    let finalRebateAmount = rawRebateAmount;

    if (!isMarginCompliant && finalOptimizedPrice > 0) {
      // Adjust rebate to comply with min margin
      const minAllowedPrice = estimatedCost / (1 - minAllowedMarginPercentage / 100);
      const maxAllowedRebate = Math.max(0, surgeAdjustedPrice - Math.ceil(minAllowedPrice));
      finalRebateAmount = Math.min(rawRebateAmount, maxAllowedRebate);
      finalRebatePercentage =
        surgeAdjustedPrice > 0 ? Math.round((finalRebateAmount / surgeAdjustedPrice) * 100) : 0;
      finalOptimizedPrice = surgeAdjustedPrice - finalRebateAmount;
      isMarginCompliant = true;
    }

    const effectiveMarginPercentage =
      finalOptimizedPrice > 0
        ? Math.round(((finalOptimizedPrice - estimatedCost) / finalOptimizedPrice) * 100 * 100) /
          100
        : 0;

    return {
      basePrice: context.basePrice,
      peakSurgeMultiplier,
      surgeAdjustedPrice,
      loyaltyRebatePercentage: finalRebatePercentage,
      loyaltyRebateAmount: finalRebateAmount,
      finalOptimizedPrice,
      effectiveMarginPercentage,
      isPeakPeriod,
      isMarginCompliant,
    };
  }
}
