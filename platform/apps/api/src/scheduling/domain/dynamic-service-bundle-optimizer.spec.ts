import { calculateDynamicBundlePricing } from './dynamic-service-bundle-optimizer';

describe('DynamicServiceBundleOptimizer', () => {
  it('calculates bundle pricing with primary and add-on items correctly', () => {
    const result = calculateDynamicBundlePricing({
      items: [
        { id: '1', name: 'Signature Haircut', basePriceUsd: 50, isAddOn: false },
        { id: '2', name: 'Beard Trim & Shape', basePriceUsd: 30, isAddOn: false },
        { id: '3', name: 'Hot Towel Treatment', basePriceUsd: 20, isAddOn: true },
      ],
    });

    expect(result.originalTotalUsd).toBe(100);
    expect(result.discountedTotalUsd).toBeLessThan(100);
    expect(result.itemizedBreakdown.length).toBe(3);
    // Add-on with primary gets add-on incentive discount (25% default)
    const hotTowel = result.itemizedBreakdown.find((i) => i.id === '3');
    expect(hotTowel?.discountAppliedUsd).toBe(5); // 25% of $20
  });

  it('respects VIP tier stacking and max discount caps', () => {
    const result = calculateDynamicBundlePricing({
      items: [{ id: '1', name: 'Haircut', basePriceUsd: 60, isAddOn: false }],
      bundleDiscountPercent: 20,
      vipTierDiscountPercent: 15,
    });

    expect(result.originalTotalUsd).toBe(60);
    // 20% + 15% = 35% discount on $60 = $21 off -> final $39
    expect(result.discountedTotalUsd).toBe(39);
    expect(result.effectiveDiscountPercent).toBe(35);
  });
});
