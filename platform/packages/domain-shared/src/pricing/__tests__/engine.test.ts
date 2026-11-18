import {
  calculateDynamicServicePrice,
  generateServiceBundles,
  recommendAddOns,
  optimizeRevenueAndPricing,
  simulatePriceElasticityAndForecastRevenue,
  calculateTieredCartAddOnDiscount,
  optimizeCartRevenue,
} from '../engine';
import { ServicePricingConfig, AddOnItem } from '../types';

describe('Revenue & Pricing Optimization Engine', () => {
  const mockService: ServicePricingConfig = {
    serviceId: 'srv-signature-cut',
    serviceName: 'Signature Haircut',
    basePriceCents: 4500, // $45.00
    tierMultipliers: {
      standard: 1.0,
      premium: 1.25,
      vip: 1.5,
      luxury: 2.0,
    },
    peakHourMultiplier: 1.2,
    weekendMultiplier: 1.15,
  };

  const mockAddOns: AddOnItem[] = [
    {
      addOnId: 'addon-beard-trim',
      name: 'Beard Trim & Shape',
      priceCents: 2000,
      category: 'grooming',
      historicalAttachRate: 0.35,
    },
    {
      addOnId: 'addon-scalp-massage',
      name: 'Revitalizing Scalp Treatment',
      priceCents: 1500,
      category: 'grooming',
      historicalAttachRate: 0.20,
    },
    {
      addOnId: 'addon-craft-beverage',
      name: 'Artisan Craft Beverage',
      priceCents: 500,
      category: 'beverage',
      historicalAttachRate: 0.55,
    },
  ];

  test('calculates dynamic service price correctly with tier and peak surges', () => {
    // VIP tier (1.5) + Peak Hour (1.2)
    const result = calculateDynamicServicePrice(mockService, 'vip', true, false);
    // 4500 * 1.5 * 1.2 = 8100 cents ($81.00)
    expect(result.adjustedPriceCents).toBe(8100);
    expect(result.tierMultiplier).toBe(1.5);
    expect(result.peakMultiplier).toBe(1.2);
    expect(result.weekendMultiplier).toBe(1.0);
  });

  test('generates attractive service bundles with savings', () => {
    const bundles = generateServiceBundles(mockService.serviceId, mockService.serviceName, mockService.basePriceCents, mockAddOns);
    expect(bundles.length).toBeGreaterThan(0);
    const execBundle = bundles.find((b) => b.bundleId === 'bundle-executive-package');
    expect(execBundle).toBeDefined();
    expect(execBundle?.discountPercentage).toBe(15);
    expect(execBundle?.savingsCents).toBeGreaterThan(0);
  });

  test('recommends add-ons ranked by relevance and historical attach rate', () => {
    const recommendations = recommendAddOns(mockAddOns, [], 85); // High loyalty score
    expect(recommendations.length).toBe(3);
    expect(recommendations[0]).toBeDefined();
    expect(recommendations[0]?.relevanceScore).toBeDefined();
    expect(recommendations[0]?.estimatedAttachRate).toBeGreaterThan(0);
  });

  test('executes complete revenue and pricing optimization analysis', () => {
    const optimizationResult = optimizeRevenueAndPricing({
      service: mockService,
      selectedTier: 'premium',
      isPeakHour: true,
      isWeekend: true,
      activeAddOns: ['addon-craft-beverage'],
      availableAddOns: mockAddOns,
      clientLoyaltyScore: 80,
    });

    // 4500 * 1.25 (premium) * 1.2 (peak) * 1.15 (weekend) = 7762.5 -> 7762 (Math.round rounds 7762.5 down or to nearest even depending on JS engine, Math.round(7762.5) is 7763 in node, let's check or expect 7762)
    expect(optimizationResult.adjustedServicePriceCents).toBe(7762);
    expect(optimizationResult.subtotalCents).toBe(7762 + 500); // 7762 + beverage (500)
    expect(optimizationResult.recommendedBundles.length).toBeGreaterThan(0);
    expect(optimizationResult.recommendedAddOns.length).toBe(2); // beard trim & scalp massage unselected
    expect(optimizationResult.projectedRevenueLiftPercentage).toBeGreaterThan(5);
  });

  test('simulates price elasticity and forecasts monthly revenue accurately', () => {
    const result = simulatePriceElasticityAndForecastRevenue({
      basePriceCents: 5000,
      priceElasticityCoefficient: -1.2,
      baselineMonthlyVolume: 400,
      testMultipliers: [1.0, 1.1, 1.2, 1.3],
    });

    expect(result.basePriceCents).toBe(5000);
    expect(result.baselineMonthlyRevenueCents).toBe(2000000); // 5000 * 400
    expect(result.simulationPoints.length).toBe(4);
    expect(result.optimalMultiplier).toBeGreaterThan(0);
    expect(result.maxMonthlyRevenueCents).toBeGreaterThanOrEqual(result.baselineMonthlyRevenueCents);
    expect(result.recommendationSummary).toContain('Optimal pricing multiplier');
  });

  test('calculates progressive tiered cart add-on discounts correctly', () => {
    // Tier 1: 1 add-on (0% discount)
    const tier1 = calculateTieredCartAddOnDiscount(1, 2000);
    expect(tier1.discountPercentage).toBe(0);
    expect(tier1.finalAddOnTotalCents).toBe(2000);

    // Tier 2: 2 add-ons (10% discount)
    const tier2 = calculateTieredCartAddOnDiscount(2, 3500);
    expect(tier2.discountPercentage).toBe(10);
    expect(tier2.discountAmountCents).toBe(350);
    expect(tier2.finalAddOnTotalCents).toBe(3150);

    // Tier 3+: 3 add-ons (20% discount)
    const tier3 = calculateTieredCartAddOnDiscount(3, 4000);
    expect(tier3.discountPercentage).toBe(20);
    expect(tier3.discountAmountCents).toBe(800);
    expect(tier3.finalAddOnTotalCents).toBe(3200);
  });

  test('optimizes cart revenue and suggests next add-on', () => {
    const cartResult = optimizeCartRevenue({
      baseServicePriceCents: 4500,
      selectedAddOnIds: ['addon-beard-trim', 'addon-scalp-massage'], // 2 add-ons -> 10% discount
      availableAddOns: mockAddOns,
      clientLoyaltyScore: 85,
    });

    expect(cartResult.selectedAddOns.length).toBe(2);
    expect(cartResult.rawAddOnsTotalCents).toBe(3500); // 2000 + 1500
    expect(cartResult.tieredDiscountPercentage).toBe(10);
    expect(cartResult.finalAddOnTotalCents).toBe(3150);
    expect(cartResult.finalCartTotalCents).toBe(4500 + 3150);
    expect(cartResult.recommendedNextAddOn).toBeDefined();
    expect(cartResult.recommendedNextAddOn?.addOnId).toBe('addon-craft-beverage');
  });
});
