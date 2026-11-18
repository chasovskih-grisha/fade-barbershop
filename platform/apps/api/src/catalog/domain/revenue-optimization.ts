/**
 * FADE Revenue & Pricing Optimization Domain Module
 * Handles peak/off-peak dynamic pricing multipliers, package bundling discounts,
 * and add-on attach rate maximization algorithms.
 */

export type ClientSegment = 'vip' | 'member' | 'student' | 'corporate' | 'standard';

export type BarberExperienceTier = 'junior' | 'standard' | 'senior' | 'master';

export interface TimeSlotContext {
  date: Date;
  locationId: string;
  utilizationRate?: number; // 0 to 1 (e.g. 0.85 for 85% capacity utilization)
  clientSegment?: ClientSegment;
  barberTier?: BarberExperienceTier;
  isHoliday?: boolean;
  isEarlyBirdHappyHour?: boolean;
}

export interface PeakPricingRule {
  peakMultiplier: number; // e.g. 1.15 for +15% peak pricing
  offPeakMultiplier: number; // e.g. 0.90 for 10% off-peak discount
  demandSurgeThreshold: number; // e.g. 0.80 (80% utilization)
  demandSurgeMultiplier: number; // e.g. 1.10 (+10% demand surge)
  holidayMultiplier?: number; // e.g. 1.25 for +25% holiday pricing
  segmentMultipliers?: Record<ClientSegment, number>;
  barberTierMultipliers?: Record<BarberExperienceTier, number>;
  earlyBirdMultiplier?: number; // e.g. 0.88 for 12% off early bird / happy hour
}

export interface ServiceBundleRule {
  bundleName: string;
  serviceIds: string[];
  discountPercentage: number; // e.g. 12 for 12% off bundle
}

export interface LastMinuteYieldRule {
  windowHours: number; // e.g. 3 hours before slot
  maxUtilizationThreshold: number; // e.g. 0.40 (40% capacity utilization)
  discountPercentage: number; // e.g. 15% off to fill empty slot
}

export interface GroupBookingRule {
  minPartySize: number;
  discountPercentage: number;
}

export interface SubscriptionPassRule {
  passName: string;
  monthlyFee: number;
  includedVisitsPerMonth: number;
  discountOnAdditionalServices: number; // percentage off extra services
}

export interface SeasonalOverrideRule {
  ruleName: string;
  fromDate: Date;
  toDate: Date;
  multiplier: number; // e.g. 1.20 for +20% seasonal peak or 0.85 for 15% promotional discount
  reason: string;
}

export interface StudioYieldContext {
  availableChairHours: number;
  bookedChairHours: number;
  averageHourlyRate: number;
  memberRetentionRate: number; // e.g. 0.75
  targetMarginPercentage: number; // e.g. 60
}

export interface AddOnRecommendation {
  serviceId: string;
  affinityScore: number; // 0 to 1
  suggestedDiscount: number; // percentage off when attached
}

export class RevenueOptimizationEngine {
  private readonly pricingRule: PeakPricingRule;

  constructor(
    pricingRule: PeakPricingRule = {
      peakMultiplier: 1.15,
      offPeakMultiplier: 0.90,
      demandSurgeThreshold: 0.80,
      demandSurgeMultiplier: 1.10,
      holidayMultiplier: 1.25,
    },
    private readonly registeredBundles: ServiceBundleRule[] = [],
    private readonly registeredSeasonalRules: SeasonalOverrideRule[] = []
  ) {
    const segmentMultipliers = pricingRule.segmentMultipliers ?? {
      vip: 0.9,
      member: 0.95,
      student: 0.92,
      corporate: 0.93,
      standard: 1,
    };
    const barberTierMultipliers = pricingRule.barberTierMultipliers ?? {
      junior: 0.85,
      standard: 1.0,
      senior: 1.20,
      master: 1.40,
    };
    const earlyBirdMultiplier = pricingRule.earlyBirdMultiplier ?? 0.88;
    this.pricingRule = {
      holidayMultiplier: 1.25,
      ...pricingRule,
      segmentMultipliers,
      barberTierMultipliers,
      earlyBirdMultiplier,
    };
  }

  /**
   * Determines if a given date/time falls into early bird happy hour.
   * Early Bird: Weekdays (Monday-Friday) 08:00 - 10:00.
   */
  isEarlyBirdTime(date: Date): boolean {
    const day = date.getDay(); // 1 = Mon, 5 = Fri
    const hour = date.getHours();
    const isWeekday = day >= 1 && day <= 5;
    return isWeekday && hour >= 8 && hour < 10;
  }

  /**
   * Determines if a given date/time falls into peak hours.
   * Peak: Weekdays 17:00 - 20:00, Saturdays and Sundays 10:00 - 19:00.
   */
  isPeakTime(date: Date): boolean {
    const day = date.getDay(); // 0 = Sun, 6 = Sat
    const hour = date.getHours();

    const isWeekend = day === 0 || day === 6;
    if (isWeekend) {
      return hour >= 10 && hour <= 19;
    }

    // Weekday peak evening
    return hour >= 17 && hour <= 20;
  }

  /**
   * Determines if a given date/time falls into off-peak hours.
   * Off-Peak: Tuesday-Thursday 09:00 - 12:00.
   */
  isOffPeakTime(date: Date): boolean {
    const day = date.getDay(); // 1 = Mon, 2 = Tue, etc.
    const hour = date.getHours();

    const isMidweek = day >= 2 && day <= 4;
    return isMidweek && hour >= 9 && hour <= 12;
  }

  /**
   * Calculates optimized dynamic price for a base price given the booking time context and capacity utilization.
   */
  calculateDynamicPrice(basePrice: number, context: TimeSlotContext): {
    finalPrice: number;
    pricingTier: 'peak' | 'off_peak' | 'standard' | 'demand_surge' | 'holiday' | 'early_bird';
    multiplierApplied: number;
    clientSegment?: ClientSegment;
    segmentMultiplierApplied?: number;
    barberTier?: BarberExperienceTier;
    barberTierMultiplierApplied?: number;
  } {
    let multiplier = 1.0;
    let pricingTier: 'peak' | 'off_peak' | 'standard' | 'demand_surge' | 'holiday' | 'early_bird' = 'standard';

    if (context.isHoliday) {
      multiplier = this.pricingRule.holidayMultiplier ?? 1.25;
      pricingTier = 'holiday';
    } else if (context.isEarlyBirdHappyHour || this.isEarlyBirdTime(context.date)) {
      multiplier = this.pricingRule.earlyBirdMultiplier ?? 0.88;
      pricingTier = 'early_bird';
    } else if (this.isPeakTime(context.date)) {
      multiplier = this.pricingRule.peakMultiplier;
      pricingTier = 'peak';
    } else if (this.isOffPeakTime(context.date)) {
      multiplier = this.pricingRule.offPeakMultiplier;
      pricingTier = 'off_peak';
    }

    // High capacity utilization demand surge override (>80% utilization)
    if (
      context.utilizationRate !== undefined &&
      context.utilizationRate >= this.pricingRule.demandSurgeThreshold &&
      pricingTier !== 'off_peak' &&
      pricingTier !== 'early_bird'
    ) {
      multiplier = Number((multiplier * this.pricingRule.demandSurgeMultiplier).toFixed(2));
      pricingTier = 'demand_surge';
    }

    let segmentMultiplier = 1.0;
    if (context.clientSegment && this.pricingRule.segmentMultipliers) {
      segmentMultiplier = this.pricingRule.segmentMultipliers[context.clientSegment] ?? 1.0;
      multiplier = Number((multiplier * segmentMultiplier).toFixed(3));
    }

    let barberTierMultiplier = 1.0;
    if (context.barberTier && this.pricingRule.barberTierMultipliers) {
      barberTierMultiplier = this.pricingRule.barberTierMultipliers[context.barberTier] ?? 1.0;
      multiplier = Number((multiplier * barberTierMultiplier).toFixed(3));
    }

    const finalPrice = Math.round(basePrice * multiplier);
    return {
      finalPrice,
      pricingTier,
      multiplierApplied: multiplier,
      ...(context.clientSegment ? { clientSegment: context.clientSegment } : {}),
      ...(segmentMultiplier !== 1 ? { segmentMultiplierApplied: segmentMultiplier } : {}),
      ...(context.barberTier ? { barberTier: context.barberTier } : {}),
      ...(barberTierMultiplier !== 1 ? { barberTierMultiplierApplied: barberTierMultiplier } : {}),
    };
  }

  /**
   * Calculates service price adjusted for the barber's experience tier (junior, standard, senior, master).
   */
  calculateBarberTierPrice(basePrice: number, tier: BarberExperienceTier): {
    finalPrice: number;
    tier: BarberExperienceTier;
    multiplier: number;
  } {
    const multi = this.pricingRule.barberTierMultipliers?.[tier] ?? 1.0;
    return {
      finalPrice: Math.round(basePrice * multi),
      tier,
      multiplier: multi,
    };
  }

  /**
   * Calculates early-bird / happy-hour discounted price.
   */
  calculateEarlyBirdPrice(basePrice: number, slotTime: Date): {
    finalPrice: number;
    isEarlyBirdEligible: boolean;
    discountPercent: number;
  } {
    const isEligible = this.isEarlyBirdTime(slotTime);
    const multi = isEligible ? (this.pricingRule.earlyBirdMultiplier ?? 0.88) : 1.0;
    const discountPercent = isEligible ? Math.round((1 - multi) * 100) : 0;

    return {
      finalPrice: Math.round(basePrice * multi),
      isEarlyBirdEligible: isEligible,
      discountPercent,
    };
  }

  /**
   * Evaluates basket of selected service IDs against registered bundles
   * and computes optimized bundle pricing.
   */
  evaluateBundleDiscounts(
    selectedServiceIds: string[],
    basePrices: Record<string, number>
  ): {
    totalBasePrice: number;
    optimizedPrice: number;
    appliedBundleName: string | null;
    savingsAmount: number;
  } {
    const totalBasePrice = selectedServiceIds.reduce(
      (sum, id) => sum + (basePrices[id] || 0),
      0
    );

    let bestOptimizedPrice = totalBasePrice;
    let appliedBundleName: string | null = null;

    for (const bundle of this.registeredBundles) {
      // Check if all bundle services are included in selected services
      const hasAllServices = bundle.serviceIds.every((id) =>
        selectedServiceIds.includes(id)
      );

      if (hasAllServices) {
        const bundleBaseTotal = bundle.serviceIds.reduce(
          (sum, id) => sum + (basePrices[id] || 0),
          0
        );
        const discountFactor = (100 - bundle.discountPercentage) / 100;
        const bundleDiscountedTotal = Math.round(bundleBaseTotal * discountFactor);

        // Price of remaining services not in bundle
        const nonBundleTotal = selectedServiceIds
          .filter((id) => !bundle.serviceIds.includes(id))
          .reduce((sum, id) => sum + (basePrices[id] || 0), 0);

        const currentOptimized = bundleDiscountedTotal + nonBundleTotal;

        if (currentOptimized < bestOptimizedPrice) {
          bestOptimizedPrice = currentOptimized;
          appliedBundleName = bundle.bundleName;
        }
      }
    }

    return {
      totalBasePrice,
      optimizedPrice: bestOptimizedPrice,
      appliedBundleName,
      savingsAmount: totalBasePrice - bestOptimizedPrice,
    };
  }

  /**
   * Evaluates multiple intersecting bundles combinatorially to find the global minimum price
   * and applied bundle combination for maximum customer savings and revenue conversion.
   */
  evaluateMultiBundleCombinations(
    selectedServiceIds: string[],
    basePrices: Record<string, number>
  ): {
    totalBasePrice: number;
    optimizedPrice: number;
    appliedBundles: string[];
    savingsAmount: number;
  } {
    const totalBasePrice = selectedServiceIds.reduce(
      (sum, id) => sum + (basePrices[id] || 0),
      0
    );

    let bestOptimizedPrice = totalBasePrice;
    let bestAppliedBundles: string[] = [];

    const applicableBundles = this.registeredBundles.filter((bundle) =>
      bundle.serviceIds.every((id) => selectedServiceIds.includes(id))
    );

    for (const bundle of applicableBundles) {
      const bundleBaseTotal = bundle.serviceIds.reduce((sum, id) => sum + (basePrices[id] || 0), 0);
      const discountFactor = (100 - bundle.discountPercentage) / 100;
      const bundleDiscountedTotal = Math.round(bundleBaseTotal * discountFactor);
      const nonBundleTotal = selectedServiceIds
        .filter((id) => !bundle.serviceIds.includes(id))
        .reduce((sum, id) => sum + (basePrices[id] || 0), 0);

      const price = bundleDiscountedTotal + nonBundleTotal;
      if (price < bestOptimizedPrice) {
        bestOptimizedPrice = price;
        bestAppliedBundles = [bundle.bundleName];
      }
    }

    for (let i = 0; i < applicableBundles.length; i++) {
      for (let j = i + 1; j < applicableBundles.length; j++) {
        const b1 = applicableBundles[i]!;
        const b2 = applicableBundles[j]!;
        const overlap = b1.serviceIds.some((id) => b2.serviceIds.includes(id));
        if (!overlap) {
          const b1Base = b1.serviceIds.reduce((sum, id) => sum + (basePrices[id] || 0), 0);
          const b2Base = b2.serviceIds.reduce((sum, id) => sum + (basePrices[id] || 0), 0);
          const b1Disc = Math.round(b1Base * ((100 - b1.discountPercentage) / 100));
          const b2Disc = Math.round(b2Base * ((100 - b2.discountPercentage) / 100));

          const covered = [...b1.serviceIds, ...b2.serviceIds];
          const remainingTotal = selectedServiceIds
            .filter((id) => !covered.includes(id))
            .reduce((sum, id) => sum + (basePrices[id] || 0), 0);

          const price = b1Disc + b2Disc + remainingTotal;
          if (price < bestOptimizedPrice) {
            bestOptimizedPrice = price;
            bestAppliedBundles = [b1.bundleName, b2.bundleName];
          }
        }
      }
    }

    return {
      totalBasePrice,
      optimizedPrice: bestOptimizedPrice,
      appliedBundles: bestAppliedBundles,
      savingsAmount: totalBasePrice - bestOptimizedPrice,
    };
  }

  /**
   * Calculates continuous dynamic capacity utilization surge multiplier
   * for fine-grained yield management based on real-time occupancy.
   */
  calculateDynamicCapacityMultiplier(baseMultiplier: number, utilizationRate: number): number {
    let factor = 1.0;
    if (utilizationRate >= 0.95) factor = 1.30;
    else if (utilizationRate >= 0.85) factor = 1.15;
    else if (utilizationRate >= 0.70) factor = 1.05;
    else if (utilizationRate <= 0.30) factor = 0.85;
    return Number((baseMultiplier * factor).toFixed(2));
  }

  /**
   * Recommends high-affinity add-on services based on current primary service selection.
   */
  getAddOnRecommendations(primaryServiceId: string): AddOnRecommendation[] {
    const affinityMap: Record<string, AddOnRecommendation[]> = {
      'service-haircut': [
        { serviceId: 'service-beard-trim', affinityScore: 0.85, suggestedDiscount: 10 },
        { serviceId: 'service-scalp-treatment', affinityScore: 0.65, suggestedDiscount: 15 },
        { serviceId: 'service-hair-styling-product', affinityScore: 0.90, suggestedDiscount: 5 },
      ],
      'service-beard-trim': [
        { serviceId: 'service-hot-towel-shave', affinityScore: 0.75, suggestedDiscount: 12 },
        { serviceId: 'service-beard-oil', affinityScore: 0.88, suggestedDiscount: 10 },
      ],
    };

    return affinityMap[primaryServiceId] || [];
  }

  /**
   * Optimizes cart add-on recommendations by filtering for minimum affinity threshold
   * and calculating potential AOV uplift and bundle savings.
   */
  optimizeCartAddOns(
    primaryServiceIds: string[],
    minAffinityScore: number = 0.70,
    addonPrices: Record<string, number> = {}
  ): {
    recommendedAddOns: { serviceId: string; affinityScore: number; suggestedDiscount: number; price: number }[];
    totalPotentialUplift: number;
  } {
    const recommendationsMap = new Map<string, { serviceId: string; affinityScore: number; suggestedDiscount: number }>();

    for (const pId of primaryServiceIds) {
      const recs = this.getAddOnRecommendations(pId);
      for (const rec of recs) {
        if (rec.affinityScore >= minAffinityScore) {
          if (!recommendationsMap.has(rec.serviceId) || recommendationsMap.get(rec.serviceId)!.affinityScore < rec.affinityScore) {
            recommendationsMap.set(rec.serviceId, rec);
          }
        }
      }
    }

    const recommendedAddOns = Array.from(recommendationsMap.values()).map((rec) => {
      const base = addonPrices[rec.serviceId] || 100;
      const discountedPrice = Math.round(base * (1 - rec.suggestedDiscount / 100));
      return {
        ...rec,
        price: discountedPrice,
      };
    });

    const totalPotentialUplift = recommendedAddOns.reduce((sum, item) => sum + item.price, 0);

    return {
      recommendedAddOns,
      totalPotentialUplift,
    };
  }

  /**
   * Calculates tiered cart add-on discounts based on the number of attached add-ons
   * to maximize attach rate and Average Order Value (AOV).
   * 1 add-on: 10% discount
   * 2 add-ons: 15% discount
   * 3+ add-ons: 20% discount
   */
  calculateTieredCartAddOnDiscount(
    addOnCount: number,
    baseAddOnTotal: number,
    customTiers?: Record<number, number>
  ): {
    tierApplied: string;
    discountPercentage: number;
    finalAddOnTotal: number;
    savingsAmount: number;
  } {
    const tiers = customTiers || {
      1: 10,
      2: 15,
      3: 20,
    };

    let discountPercentage = 0;
    if (addOnCount >= 3) {
      discountPercentage = tiers[3] ?? 20;
    } else if (addOnCount === 2) {
      discountPercentage = tiers[2] ?? 15;
    } else if (addOnCount === 1) {
      discountPercentage = tiers[1] ?? 10;
    }

    const savingsAmount = Math.round((baseAddOnTotal * discountPercentage) / 100);
    const finalAddOnTotal = baseAddOnTotal - savingsAmount;

    return {
      tierApplied: addOnCount >= 3 ? 'tier_3_plus' : addOnCount === 2 ? 'tier_2' : addOnCount === 1 ? 'tier_1' : 'none',
      discountPercentage,
      finalAddOnTotal,
      savingsAmount,
    };
  }

  /**
   * Calculates last-minute yield optimized price for perishable time slots
   * with low capacity utilization within a short time window.
   */
  calculateLastMinuteYieldPrice(
    basePrice: number,
    slotStartTime: Date,
    bookingTime: Date = new Date(),
    utilizationRate: number = 0.30,
    rule?: LastMinuteYieldRule
  ): {
    finalPrice: number;
    isLastMinuteYieldEligible: boolean;
    discountApplied: number;
    yieldStrategy: 'last_minute_fill' | 'standard';
  } {
    const yieldRule = rule || {
      windowHours: 3,
      maxUtilizationThreshold: 0.40,
      discountPercentage: 15,
    };

    const diffHours = (slotStartTime.getTime() - bookingTime.getTime()) / (1000 * 60 * 60);
    const isWithinWindow = diffHours >= 0 && diffHours <= yieldRule.windowHours;
    const isLowUtilization = utilizationRate <= yieldRule.maxUtilizationThreshold;

    if (isWithinWindow && isLowUtilization) {
      const discount = yieldRule.discountPercentage;
      const finalPrice = Math.round(basePrice * (1 - discount / 100));
      return {
        finalPrice,
        isLastMinuteYieldEligible: true,
        discountApplied: discount,
        yieldStrategy: 'last_minute_fill',
      };
    }

    return {
      finalPrice: basePrice,
      isLastMinuteYieldEligible: false,
      discountApplied: 0,
      yieldStrategy: 'standard',
    };
  }

  /**
   * Calculates group booking / party discount for multi-person bookings
   * to incentivize group/wedding/event bookings and maximize total ticket value.
   */
  calculateGroupBookingDiscount(
    baseTotal: number,
    partySize: number,
    customRules?: GroupBookingRule[]
  ): {
    partySize: number;
    baseTotal: number;
    discountPercentage: number;
    discountAmount: number;
    finalTotal: number;
    isGroupEligible: boolean;
  } {
    const rules = customRules || [
      { minPartySize: 5, discountPercentage: 15 },
      { minPartySize: 3, discountPercentage: 10 },
    ];

    const sortedRules = [...rules].sort((a, b) => b.minPartySize - a.minPartySize);
    
    let discountPercentage = 0;
    for (const rule of sortedRules) {
      if (partySize >= rule.minPartySize) {
        discountPercentage = rule.discountPercentage;
        break;
      }
    }

    const discountAmount = Math.round((baseTotal * discountPercentage) / 100);
    const finalTotal = baseTotal - discountAmount;

    return {
      partySize,
      baseTotal,
      discountPercentage,
      discountAmount,
      finalTotal,
      isGroupEligible: discountPercentage > 0,
    };
  }

  /**
   * Calculates monthly subscription pass value, customer savings, and recurring revenue potential.
   */
  calculateSubscriptionPassValue(
    passRule: SubscriptionPassRule,
    expectedMonthlyUsage: { serviceId: string; basePrice: number; visits: number }[]
  ): {
    passName: string;
    monthlyFee: number;
    totalUnbundledSpend: number;
    effectiveMonthlySpend: number;
    customerSavingsAmount: number;
    isPassEconomicalForClient: boolean;
  } {
    const totalUnbundledSpend = expectedMonthlyUsage.reduce(
      (sum, item) => sum + item.basePrice * item.visits,
      0
    );

    const totalVisits = expectedMonthlyUsage.reduce((sum, item) => sum + item.visits, 0);
    const extraVisits = Math.max(0, totalVisits - passRule.includedVisitsPerMonth);

    const avgServicePrice = totalVisits > 0 ? totalUnbundledSpend / totalVisits : 0;
    const discountedExtraSpend = extraVisits * avgServicePrice * (1 - passRule.discountOnAdditionalServices / 100);

    const effectiveMonthlySpend = passRule.monthlyFee + Math.round(discountedExtraSpend);
    const customerSavingsAmount = Math.max(0, totalUnbundledSpend - effectiveMonthlySpend);

    return {
      passName: passRule.passName,
      monthlyFee: passRule.monthlyFee,
      totalUnbundledSpend,
      effectiveMonthlySpend,
      customerSavingsAmount,
      isPassEconomicalForClient: customerSavingsAmount > 0,
    };
  }

  /**
   * Calculates price adjusted for seasonal or promotional date range overrides.
   */
  calculateSeasonalOverridePrice(
    basePrice: number,
    bookingDate: Date,
    customRules?: SeasonalOverrideRule[]
  ): {
    finalPrice: number;
    appliedRuleName: string | null;
    multiplierApplied: number;
    reason: string | null;
  } {
    const rules = customRules || this.registeredSeasonalRules;
    const time = bookingDate.getTime();

    for (const rule of rules) {
      if (time >= rule.fromDate.getTime() && time <= rule.toDate.getTime()) {
        const finalPrice = Math.round(basePrice * rule.multiplier);
        return {
          finalPrice,
          appliedRuleName: rule.ruleName,
          multiplierApplied: rule.multiplier,
          reason: rule.reason,
        };
      }
    }

    return {
      finalPrice: basePrice,
      appliedRuleName: null,
      multiplierApplied: 1.0,
      reason: null,
    };
  }

  /**
   * Simulates price elasticity and revenue impact of price changes on demand volume
   * using economic price elasticity coefficients.
   */
  calculateElasticityRevenueImpact(
    basePrice: number,
    proposedPrice: number,
    baselineDailyBookings: number,
    elasticityCoefficient: number = -1.5
  ): {
    basePrice: number;
    proposedPrice: number;
    priceChangePercentage: number;
    expectedDailyBookings: number;
    baselineDailyRevenue: number;
    expectedDailyRevenue: number;
    dailyRevenueChange: number;
    isRevenueEnhancing: boolean;
  } {
    const priceChangeRatio = (proposedPrice - basePrice) / basePrice;
    const priceChangePercentage = Number((priceChangeRatio * 100).toFixed(2));
    
    // Demand quantity change percentage = elasticity * price change percentage
    const demandChangeRatio = elasticityCoefficient * priceChangeRatio;
    const expectedDailyBookings = Math.max(0, Number((baselineDailyBookings * (1 + demandChangeRatio)).toFixed(1)));
    
    const baselineDailyRevenue = Math.round(basePrice * baselineDailyBookings);
    const expectedDailyRevenue = Math.round(proposedPrice * expectedDailyBookings);
    const dailyRevenueChange = expectedDailyRevenue - baselineDailyRevenue;

    return {
      basePrice,
      proposedPrice,
      priceChangePercentage,
      expectedDailyBookings,
      baselineDailyRevenue,
      expectedDailyRevenue,
      dailyRevenueChange,
      isRevenueEnhancing: dailyRevenueChange > 0,
    };
  }

  /**
   * Calculates studio revenue per available chair hour (RevPACH) and optimizes
   * member loyalty rebate and pricing yield based on capacity utilization.
   */
  calculateStudioYieldRebateOptimization(
    context: StudioYieldContext,
    baseServicePrice: number
  ): {
    utilizationRate: number;
    revpach: number;
    recommendedLoyaltyRebatePercentage: number;
    effectiveServicePrice: number;
    projectedStudioYieldUplift: number;
    isYieldOptimized: boolean;
  } {
    const utilizationRate = context.availableChairHours > 0
      ? Number((context.bookedChairHours / context.availableChairHours).toFixed(4))
      : 0;

    const revpach = context.availableChairHours > 0
      ? Math.round((context.bookedChairHours * context.averageHourlyRate) / context.availableChairHours)
      : 0;

    // Dynamic loyalty rebate: lower utilization (< 60%) triggers higher rebate (e.g. 15%) to fill chairs;
    // high utilization (> 85%) reduces rebate (e.g. 5%) to maximize margin.
    let recommendedLoyaltyRebatePercentage = 10;
    if (utilizationRate < 0.60) {
      recommendedLoyaltyRebatePercentage = 15;
    } else if (utilizationRate > 0.85) {
      recommendedLoyaltyRebatePercentage = 5;
    }

    const rebateAmount = Math.round((baseServicePrice * recommendedLoyaltyRebatePercentage) / 100);
    const effectiveServicePrice = baseServicePrice - rebateAmount;

    // Projected yield uplift factor based on LTV retention multiplier
    const retentionBoost = (1 - context.memberRetentionRate) * 0.2;
    const projectedStudioYieldUplift = Math.round(revpach * (1 + utilizationRate * 0.15 + retentionBoost));
    const isYieldOptimized = utilizationRate >= 0.50 && revpach > 0;

    return {
      utilizationRate,
      revpach,
      recommendedLoyaltyRebatePercentage,
      effectiveServicePrice,
      projectedStudioYieldUplift,
      isYieldOptimized,
    };
  }
}
