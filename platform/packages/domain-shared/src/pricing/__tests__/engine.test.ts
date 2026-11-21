import {
  calculateDynamicServicePrice,
  generateServiceBundles,
  recommendAddOns,
  optimizeRevenueAndPricing,
} from '../engine';
import { mockAddOns, mockService } from '../test-fixtures';

describe('Revenue & Pricing Optimization Engine', () => {
  test('calculates dynamic service price with tier and peak surges', () => {
    const result = calculateDynamicServicePrice({
      service: mockService,
      tier: 'vip',
      isPeakHour: true,
      isWeekend: false,
    });
    expect(result.adjustedPriceCents).toBe(8100);
    expect(result.tierMultiplier).toBe(1.5);
    expect(result.peakMultiplier).toBe(1.2);
    expect(result.weekendMultiplier).toBe(1.0);
  });

  test('generates attractive service bundles with savings', () => {
    const bundles = generateServiceBundles({
      primaryServiceId: mockService.serviceId,
      primaryServiceName: mockService.serviceName,
      primaryPriceCents: mockService.basePriceCents,
      availableAddOns: mockAddOns,
    });
    expect(bundles.length).toBeGreaterThan(0);
    const execBundle = bundles.find((bundle) => bundle.bundleId === 'bundle-executive-package');
    expect(execBundle).toBeDefined();
    expect(execBundle?.discountPercentage).toBe(15);
    expect(execBundle?.savingsCents).toBeGreaterThan(0);
  });

  test('recommends add-ons ranked by relevance and historical attach rate', () => {
    const recommendations = recommendAddOns(mockAddOns, [], 85);
    expect(recommendations.length).toBe(3);
    expect(recommendations[0]).toBeDefined();
    expect(recommendations[0]?.relevanceScore).toBeDefined();
    expect(recommendations[0]?.estimatedAttachRate).toBeGreaterThan(0);
  });

  test('executes complete revenue and pricing optimization analysis', () => {
    const result = optimizeRevenueAndPricing({
      service: mockService,
      selectedTier: 'premium',
      isPeakHour: true,
      isWeekend: true,
      activeAddOns: ['addon-craft-beverage'],
      availableAddOns: mockAddOns,
      clientLoyaltyScore: 80,
    });

    expect(result.adjustedServicePriceCents).toBe(7762);
    expect(result.subtotalCents).toBe(7762 + 500);
    expect(result.recommendedBundles.length).toBeGreaterThan(0);
    expect(result.recommendedAddOns.length).toBe(2);
    expect(result.projectedRevenueLiftPercentage).toBeGreaterThan(5);
  });
});
