import { RevenueYieldBooster, CrossSellItem } from './revenue-yield-booster';

describe('RevenueYieldBooster', () => {
  const booster = new RevenueYieldBooster();

  test('calculates scarcity multiplier for high demand master barber', () => {
    const result = booster.calculateBarberScarcityMultiplier({
      tier: 'master',
      availableCapacitySlots: 1,
      totalCapacitySlots: 10,
      historicalDemandScore: 0.95,
    });

    expect(result.utilizationRate).toBe(0.90);
    expect(result.isHighDemand).toBe(true);
    expect(result.scarcityMultiplier).toBe(1.25);
  });

  test('calculates normal scarcity multiplier for low utilization', () => {
    const result = booster.calculateBarberScarcityMultiplier({
      tier: 'senior',
      availableCapacitySlots: 6,
      totalCapacitySlots: 10,
      historicalDemandScore: 0.40,
    });

    expect(result.utilizationRate).toBe(0.40);
    expect(result.isHighDemand).toBe(false);
    expect(result.scarcityMultiplier).toBe(1.0);
  });

  test('optimizes cross-sell recommendations based on margin and attach rate', () => {
    const candidates: CrossSellItem[] = [
      { serviceId: 'add-on-beard', basePrice: 400, category: 'grooming', marginScore: 0.85, historicalAttachRate: 0.45 },
      { serviceId: 'add-on-facial', basePrice: 600, category: 'skincare', marginScore: 0.90, historicalAttachRate: 0.25 },
      { serviceId: 'add-on-product', basePrice: 250, category: 'styling', marginScore: 0.60, historicalAttachRate: 0.60 },
    ];

    const result = booster.optimizeCrossSellRecommendations('service-haircut', candidates, 2);

    expect(result.recommendedServiceIds.length).toBe(2);
    expect(result.recommendedServiceIds).toContain('add-on-beard');
    expect(result.estimatedRevenueUplift).toBeGreaterThan(0);
  });

  test('calculates promotional bundle price with margin guardrails', () => {
    const bundle = booster.calculatePromotionalBundleYield([800, 500], 25, 30);

    expect(bundle.totalBasePrice).toBe(1300);
    expect(bundle.isMarginCompliant).toBe(true);
    expect(bundle.optimizedBundlePrice).toBeLessThanOrEqual(1300);
    expect(bundle.actualDiscountPercentage).toBeGreaterThan(0);
  });

  test('calculates smart cart add-on attach incentive and progressive discounting', () => {
    const cart = [
      { itemId: 'haircut', basePrice: 1000, isAddOn: false, marginScore: 0.80 },
      { itemId: 'beard', basePrice: 400, isAddOn: true, marginScore: 0.85 },
      { itemId: 'tonic', basePrice: 200, isAddOn: true, marginScore: 0.70 },
    ];

    const result = booster.calculateSmartCartAttachIncentive(cart, 40);

    expect(result.primaryItemCount).toBe(1);
    expect(result.addOnItemCount).toBe(2);
    expect(result.currentAttachRate).toBe(2.0);
    expect(result.appliedDiscountPercentage).toBe(10); // 2 add-ons = 10% discount
    expect(result.originalCartTotal).toBe(1600);
    expect(result.discountedCartTotal).toBe(1540); // 10% off 600 add-ons = 60 off
    expect(result.isMarginCompliant).toBe(true);
  });

  test('calculates peak demand surge pricing and loyalty rebate with margin guardrails', () => {
    // Saturday at 16:00 (peak period) with platinum client (10% rebate)
    const result = booster.calculatePeakDemandYieldAndLoyaltyRebate({
      basePrice: 1000,
      dayOfWeek: 6, // Saturday
      hourOfDay: 16, // 4 PM
      clientLoyaltyTier: 'platinum',
      marginScore: 0.80,
    }, 35);

    expect(result.isPeakPeriod).toBe(true);
    expect(result.peakSurgeMultiplier).toBe(1.15);
    expect(result.surgeAdjustedPrice).toBe(1150);
    expect(result.loyaltyRebatePercentage).toBe(10);
    expect(result.finalOptimizedPrice).toBe(1035);
    expect(result.isMarginCompliant).toBe(true);
  });
});
