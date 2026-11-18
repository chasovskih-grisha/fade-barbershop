import { DynamicSurgePacingOptimizer } from './dynamic-surge-pacing-optimizer';

describe('DynamicSurgePacingOptimizer', () => {
  it('applies slow hour discount when fill rate is low', () => {
    const result = DynamicSurgePacingOptimizer.calculatePacedPricing({
      basePrice: 50,
      historicalFillRate: 0.2,
      weatherCondition: 'clear',
      localEventFactor: 0,
      isSlowHour: true,
    });
    expect(result.slowHourDiscountApplied).toBe(true);
    expect(result.surgeApplied).toBe(false);
    expect(result.finalPrice).toBe(42.5); // 50 * 0.85
  });

  it('applies surge pricing when historical fill rate is high', () => {
    const result = DynamicSurgePacingOptimizer.calculatePacedPricing({
      basePrice: 60,
      historicalFillRate: 0.85,
      weatherCondition: 'clear',
      localEventFactor: 0.2,
      isSlowHour: false,
    });
    expect(result.surgeApplied).toBe(true);
    expect(result.slowHourDiscountApplied).toBe(false);
    expect(result.pacingMultiplier).toBe(1.5); // 1.0 + 0.3 (fill) + 0.2 (event) = 1.5
    expect(result.finalPrice).toBe(90);
  });

  it('dampens pricing during bad weather conditions', () => {
    const result = DynamicSurgePacingOptimizer.calculatePacedPricing({
      basePrice: 100,
      historicalFillRate: 0.5,
      weatherCondition: 'rain',
      localEventFactor: 0,
      isSlowHour: false,
    });
    expect(result.pacingMultiplier).toBe(0.95);
    expect(result.finalPrice).toBe(95);
  });
});
