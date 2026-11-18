import { RevenueOptimizationEngine } from './revenue-optimization';

describe('RevenueOptimizationEngine', () => {
  const engine = new RevenueOptimizationEngine(
    { peakMultiplier: 1.15, offPeakMultiplier: 0.90, demandSurgeThreshold: 0.80, demandSurgeMultiplier: 1.10 },
    [
      {
        bundleName: 'Executive Grooming Combo',
        serviceIds: ['service-haircut', 'service-beard-trim'],
        discountPercentage: 15,
      },
    ]
  );

  test('detects peak time correctly (weekend afternoon)', () => {
    const saturdayAfternoon = new Date('2026-11-14T14:00:00'); // Nov 14, 2026 is Saturday
    expect(engine.isPeakTime(saturdayAfternoon)).toBe(true);
  });

  test('detects peak time correctly (weekday evening)', () => {
    const wednesdayEvening = new Date('2026-11-11T18:00:00'); // Nov 11, 2026 is Wednesday
    expect(engine.isPeakTime(wednesdayEvening)).toBe(true);
  });

  test('detects off-peak time correctly (midweek morning)', () => {
    const wednesdayMorning = new Date('2026-11-11T10:00:00');
    expect(engine.isOffPeakTime(wednesdayMorning)).toBe(true);
  });

  test('calculates peak dynamic price with surge multiplier', () => {
    const saturdayAfternoon = new Date('2026-11-14T14:00:00');
    const result = engine.calculateDynamicPrice(1000, {
      date: saturdayAfternoon,
      locationId: 'loc-1',
    });

    expect(result.pricingTier).toBe('peak');
    expect(result.multiplierApplied).toBe(1.15);
    expect(result.finalPrice).toBe(1150);
  });

  test('calculates off-peak dynamic price with discount multiplier', () => {
    const wednesdayMorning = new Date('2026-11-11T10:00:00');
    const result = engine.calculateDynamicPrice(1000, {
      date: wednesdayMorning,
      locationId: 'loc-1',
    });

    expect(result.pricingTier).toBe('off_peak');
    expect(result.multiplierApplied).toBe(0.90);
    expect(result.finalPrice).toBe(900);
  });

  test('calculates demand surge price when capacity utilization exceeds threshold', () => {
    const standardTime = new Date('2026-11-11T14:00:00'); // Wednesday 2pm (standard time slot)
    const result = engine.calculateDynamicPrice(1000, {
      date: standardTime,
      locationId: 'loc-1',
      utilizationRate: 0.85, // 85% utilization (> 80% threshold)
    });

    expect(result.pricingTier).toBe('demand_surge');
    expect(result.multiplierApplied).toBe(1.10);
    expect(result.finalPrice).toBe(1100);
  });

  test('evaluates bundle discounts for combo selection', () => {
    const prices = {
      'service-haircut': 800,
      'service-beard-trim': 500,
    };

    const evaluation = engine.evaluateBundleDiscounts(
      ['service-haircut', 'service-beard-trim'],
      prices
    );

    expect(evaluation.totalBasePrice).toBe(1300);
    expect(evaluation.appliedBundleName).toBe('Executive Grooming Combo');
    expect(evaluation.optimizedPrice).toBe(1105);
    expect(evaluation.savingsAmount).toBe(195);
  });

  test('provides high-affinity add-on recommendations', () => {
    const recommendations = engine.getAddOnRecommendations('service-haircut');
    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations.some((r) => r.serviceId === 'service-beard-trim')).toBe(true);
  });

  test('calculates dynamic price with VIP client segment loyalty discount', () => {
    const standardTime = new Date('2026-11-11T14:00:00'); // Wednesday 2pm
    const result = engine.calculateDynamicPrice(1000, {
      date: standardTime,
      locationId: 'loc-1',
      clientSegment: 'vip',
    });

    expect(result.clientSegment).toBe('vip');
    expect(result.segmentMultiplierApplied).toBe(0.90);
    expect(result.finalPrice).toBe(900);
  });

  test('calculates holiday dynamic price multiplier when isHoliday is true', () => {
    const standardTime = new Date('2026-12-25T14:00:00'); // Christmas
    const result = engine.calculateDynamicPrice(1000, {
      date: standardTime,
      locationId: 'loc-1',
      isHoliday: true,
    });

    expect(result.pricingTier).toBe('holiday');
    expect(result.multiplierApplied).toBe(1.25);
    expect(result.finalPrice).toBe(1250);
  });

  test('optimizes cart add-on attach recommendations and computes potential uplift', () => {
    const addonPrices = {
      'service-beard-trim': 500,
      'service-hair-styling-product': 200,
    };
    const optimization = engine.optimizeCartAddOns(['service-haircut'], 0.80, addonPrices);

    expect(optimization.recommendedAddOns.length).toBeGreaterThan(0);
    expect(optimization.totalPotentialUplift).toBeGreaterThan(0);
  });

  test('calculates tiered cart add-on discounts for 1, 2, and 3+ add-ons to maximize attach rate', () => {
    const tier1 = engine.calculateTieredCartAddOnDiscount(1, 1000);
    expect(tier1.tierApplied).toBe('tier_1');
    expect(tier1.discountPercentage).toBe(10);
    expect(tier1.finalAddOnTotal).toBe(900);

    const tier2 = engine.calculateTieredCartAddOnDiscount(2, 1000);
    expect(tier2.tierApplied).toBe('tier_2');
    expect(tier2.discountPercentage).toBe(15);
    expect(tier2.finalAddOnTotal).toBe(850);

    const tier3 = engine.calculateTieredCartAddOnDiscount(3, 1000);
    expect(tier3.tierApplied).toBe('tier_3_plus');
    expect(tier3.discountPercentage).toBe(20);
    expect(tier3.finalAddOnTotal).toBe(800);
  });

  test('calculates last-minute yield discount for low-utilization empty slots within window', () => {
    const slotTime = new Date('2026-11-11T14:00:00');
    const bookingTime = new Date('2026-11-11T12:30:00'); // 1.5 hours before slot (< 3h window)
    const result = engine.calculateLastMinuteYieldPrice(1000, slotTime, bookingTime, 0.25);

    expect(result.isLastMinuteYieldEligible).toBe(true);
    expect(result.yieldStrategy).toBe('last_minute_fill');
    expect(result.discountApplied).toBe(15);
    expect(result.finalPrice).toBe(850);
  });

  test('calculates group booking / party discount for multi-person bookings', () => {
    const groupResult = engine.calculateGroupBookingDiscount(5000, 4); // party size 4
    expect(groupResult.isGroupEligible).toBe(true);
    expect(groupResult.discountPercentage).toBe(10);
    expect(groupResult.discountAmount).toBe(500);
    expect(groupResult.finalTotal).toBe(4500);

    const largeGroupResult = engine.calculateGroupBookingDiscount(10000, 6); // party size 6
    expect(largeGroupResult.isGroupEligible).toBe(true);
    expect(largeGroupResult.discountPercentage).toBe(15);
    expect(largeGroupResult.discountAmount).toBe(1500);
    expect(largeGroupResult.finalTotal).toBe(8500);

    const smallGroupResult = engine.calculateGroupBookingDiscount(2000, 2); // party size 2 (not eligible)
    expect(smallGroupResult.isGroupEligible).toBe(false);
    expect(smallGroupResult.discountPercentage).toBe(0);
    expect(smallGroupResult.finalTotal).toBe(2000);
  });

  test('calculates monthly subscription pass value and savings', () => {
    const passRule = {
      passName: 'Unlimited Fade Pass',
      monthlyFee: 1800,
      includedVisitsPerMonth: 2,
      discountOnAdditionalServices: 15,
    };
    const usage = [
      { serviceId: 'service-haircut', basePrice: 1000, visits: 3 },
    ];
    const result = engine.calculateSubscriptionPassValue(passRule, usage);
    expect(result.passName).toBe('Unlimited Fade Pass');
    expect(result.totalUnbundledSpend).toBe(3000);
    expect(result.isPassEconomicalForClient).toBe(true);
    expect(result.customerSavingsAmount).toBeGreaterThan(0);
  });

  test('calculates barber experience tier pricing surcharge correctly', () => {
    const juniorResult = engine.calculateBarberTierPrice(1000, 'junior');
    expect(juniorResult.finalPrice).toBe(850);
    expect(juniorResult.multiplier).toBe(0.85);

    const masterResult = engine.calculateBarberTierPrice(1000, 'master');
    expect(masterResult.finalPrice).toBe(1400);
    expect(masterResult.multiplier).toBe(1.40);
  });

  test('calculates early-bird happy hour pricing discount correctly', () => {
    const earlyMorning = new Date('2026-11-11T08:30:00'); // Wednesday 8:30 AM
    const result = engine.calculateEarlyBirdPrice(1000, earlyMorning);
    expect(result.isEarlyBirdEligible).toBe(true);
    expect(result.discountPercent).toBe(12);
    expect(result.finalPrice).toBe(880);

    const normalTime = new Date('2026-11-11T14:00:00'); // Wednesday 2:00 PM
    const normalResult = engine.calculateEarlyBirdPrice(1000, normalTime);
    expect(normalResult.isEarlyBirdEligible).toBe(false);
    expect(normalResult.finalPrice).toBe(1000);
  });

  test('calculates seasonal and promotional date range override price correctly', () => {
    const rules = [
      {
        ruleName: 'Black Friday Promo',
        fromDate: new Date('2026-11-20T00:00:00'),
        toDate: new Date('2026-11-30T23:59:59'),
        multiplier: 0.80, // 20% off
        reason: 'Holiday promotional discount',
      },
    ];

    const promoDate = new Date('2026-11-25T14:00:00');
    const result = engine.calculateSeasonalOverridePrice(1000, promoDate, rules);
    expect(result.appliedRuleName).toBe('Black Friday Promo');
    expect(result.multiplierApplied).toBe(0.80);
    expect(result.finalPrice).toBe(800);
    expect(result.reason).toBe('Holiday promotional discount');

    const regularDate = new Date('2026-11-10T14:00:00');
    const regularResult = engine.calculateSeasonalOverridePrice(1000, regularDate, rules);
    expect(regularResult.appliedRuleName).toBeNull();
    expect(regularResult.multiplierApplied).toBe(1.0);
    expect(regularResult.finalPrice).toBe(1000);
  });

  test('simulates price elasticity and revenue impact on demand volume correctly', () => {
    // Increase price from 1000 to 1100 (+10%), elasticity -1.5
    const simulation = engine.calculateElasticityRevenueImpact(1000, 1100, 20, -1.5);
    expect(simulation.priceChangePercentage).toBe(10);
    expect(simulation.expectedDailyBookings).toBeLessThan(20);
    expect(simulation.baselineDailyRevenue).toBe(20000);
    expect(typeof simulation.dailyRevenueChange).toBe('number');
  });

  test('evaluates multi-bundle combinations combinatorially', () => {
    const multiEngine = new RevenueOptimizationEngine(
      { peakMultiplier: 1.15, offPeakMultiplier: 0.90, demandSurgeThreshold: 0.80, demandSurgeMultiplier: 1.10 },
      [
        { bundleName: 'Haircut & Beard', serviceIds: ['s1', 's2'], discountPercentage: 10 },
        { bundleName: 'Styling Addon', serviceIds: ['s4'], discountPercentage: 5 },
      ]
    );

    const prices = { s1: 1000, s2: 500, s4: 300 };
    const result = multiEngine.evaluateMultiBundleCombinations(['s1', 's2', 's4'], prices);
    expect(result.totalBasePrice).toBe(1800);
    expect(result.appliedBundles.length).toBeGreaterThan(0);
    expect(result.optimizedPrice).toBeLessThan(1800);
  });

  test('calculates continuous dynamic capacity utilization surge multiplier', () => {
    const multiplier = engine.calculateDynamicCapacityMultiplier(1.15, 0.96);
    expect(multiplier).toBe(1.49);
  });

  test('calculates studio RevPACH and optimizes member loyalty rebate and yield', () => {
    const yieldResult = engine.calculateStudioYieldRebateOptimization({
      availableChairHours: 40,
      bookedChairHours: 20, // 50% utilization (< 60%)
      averageHourlyRate: 1500,
      memberRetentionRate: 0.70,
      targetMarginPercentage: 60,
    }, 1000);

    expect(yieldResult.utilizationRate).toBe(0.5);
    expect(yieldResult.revpach).toBe(750);
    expect(yieldResult.recommendedLoyaltyRebatePercentage).toBe(15); // Higher rebate to fill chairs
    expect(yieldResult.effectiveServicePrice).toBe(850);
    expect(yieldResult.isYieldOptimized).toBe(true);
  });
});
