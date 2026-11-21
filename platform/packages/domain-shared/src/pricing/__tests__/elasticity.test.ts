import {
  simulatePriceElasticityAndForecastRevenue,
  calculateTieredCartAddOnDiscount,
  optimizeCartRevenue,
} from '../engine';
import { mockAddOns } from '../test-fixtures';

describe('Price elasticity and cart optimization', () => {
  test('simulates price elasticity and forecasts monthly revenue', () => {
    const result = simulatePriceElasticityAndForecastRevenue({
      basePriceCents: 5000,
      priceElasticityCoefficient: -1.2,
      baselineMonthlyVolume: 400,
      testMultipliers: [1.0, 1.1, 1.2, 1.3],
    });

    expect(result.basePriceCents).toBe(5000);
    expect(result.baselineMonthlyRevenueCents).toBe(2000000);
    expect(result.simulationPoints.length).toBe(4);
    expect(result.optimalMultiplier).toBeGreaterThan(0);
    expect(result.maxMonthlyRevenueCents).toBeGreaterThanOrEqual(
      result.baselineMonthlyRevenueCents
    );
    expect(result.recommendationSummary).toContain('Optimal pricing multiplier');
  });

  test('calculates progressive tiered cart add-on discounts', () => {
    expect(calculateTieredCartAddOnDiscount(1, 2000).discountPercentage).toBe(0);
    expect(calculateTieredCartAddOnDiscount(1, 2000).finalAddOnTotalCents).toBe(2000);

    const tier2 = calculateTieredCartAddOnDiscount(2, 3500);
    expect(tier2.discountPercentage).toBe(10);
    expect(tier2.discountAmountCents).toBe(350);
    expect(tier2.finalAddOnTotalCents).toBe(3150);

    const tier3 = calculateTieredCartAddOnDiscount(3, 4000);
    expect(tier3.discountPercentage).toBe(20);
    expect(tier3.discountAmountCents).toBe(800);
    expect(tier3.finalAddOnTotalCents).toBe(3200);
  });

  test('optimizes cart revenue and suggests next add-on', () => {
    const result = optimizeCartRevenue({
      baseServicePriceCents: 4500,
      selectedAddOnIds: ['addon-beard-trim', 'addon-scalp-massage'],
      availableAddOns: mockAddOns,
      clientLoyaltyScore: 85,
    });

    expect(result.selectedAddOns.length).toBe(2);
    expect(result.rawAddOnsTotalCents).toBe(3500);
    expect(result.tieredDiscountPercentage).toBe(10);
    expect(result.finalAddOnTotalCents).toBe(3150);
    expect(result.finalCartTotalCents).toBe(4500 + 3150);
    expect(result.recommendedNextAddOn).toBeDefined();
    expect(result.recommendedNextAddOn?.addOnId).toBe('addon-craft-beverage');
  });
});
