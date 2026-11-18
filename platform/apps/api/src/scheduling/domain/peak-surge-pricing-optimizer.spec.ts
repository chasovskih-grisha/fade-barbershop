import { PeakSurgePricingOptimizer } from './peak-surge-pricing-optimizer';

describe('PeakSurgePricingOptimizer', () => {
  it('calculates standard price when no peak or high demand', () => {
    const result = PeakSurgePricingOptimizer.calculateSurgePrice({
      basePrice: 50,
      demandFactor: 0.0,
      isPeakHour: false,
      vipPriorityMultiplier: 1.0,
    });
    expect(result.surgeApplied).toBe(false);
    expect(result.finalPrice).toBe(50);
  });

  it('applies surge pricing during peak hours with high demand', () => {
    const result = PeakSurgePricingOptimizer.calculateSurgePrice({
      basePrice: 60,
      demandFactor: 0.8,
      isPeakHour: true,
      vipPriorityMultiplier: 1.0,
    });
    expect(result.surgeApplied).toBe(true);
    expect(result.surgeMultiplier).toBe(1.65); // 1.0 + 0.25 (peak) + 0.4 (demand) = 1.65
    expect(result.finalPrice).toBe(99);
  });

  it('caps surge multiplier for VIP clients', () => {
    const result = PeakSurgePricingOptimizer.calculateSurgePrice({
      basePrice: 100,
      demandFactor: 1.5,
      isPeakHour: true,
      vipPriorityMultiplier: 1.2,
    });
    expect(result.surgeApplied).toBe(true);
    expect(result.surgeMultiplier).toBe(1.35); // capped at 1.35 for VIP
    expect(result.finalPrice).toBe(135);
  });
});
