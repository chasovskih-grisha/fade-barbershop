import { RevenueSubscriptionRetentionBooster } from './revenue-subscription-retention-booster';

describe('RevenueSubscriptionRetentionBooster', () => {
  const booster = new RevenueSubscriptionRetentionBooster();

  test('evaluates retention tier correctly for subscribed duration', () => {
    const silver = booster.evaluateRetentionTier(4);
    expect(silver?.tierName).toBe('Silver Member');

    const gold = booster.evaluateRetentionTier(8);
    expect(gold?.tierName).toBe('Gold Member');

    const diamond = booster.evaluateRetentionTier(15);
    expect(diamond?.tierName).toBe('Black Diamond Member');

    const newbie = booster.evaluateRetentionTier(1);
    expect(newbie).toBeNull();
  });

  test('calculates retained member value and LTV uplift correctly', () => {
    const valuation = booster.calculateRetainedMemberValue(1500, 12, 0.08);
    expect(valuation.tierName).toBe('Black Diamond Member');
    expect(valuation.effectiveDiscountPercentage).toBe(15);
    expect(valuation.adjustedMonthlyFee).toBe(1275);
    expect(valuation.priorityBookingWindowHours).toBe(72);
    expect(valuation.projectedLTVUplift).toBeGreaterThan(0);
  });
});
