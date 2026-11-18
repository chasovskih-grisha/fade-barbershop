import { VipContractPricingEngine } from './vip-contract-pricing';

describe('VipContractPricingEngine', () => {
  const engine = new VipContractPricingEngine();

  it('should calculate correct discounts for gold tier corporate account', () => {
    const result = engine.calculateVipQuote(5000, 2000, {
      accountId: 'corp-123',
      tier: 'gold',
      rolling30DaySpend: 6500,
      activeEmployeeCount: 25,
      contractTermMonths: 12,
    });

    expect(result.tier).toBe('gold');
    expect(result.originalTotal).toBe(7000);
    // Gold tier: 10% on service (5000 * 0.9 = 4500), 15% on products (2000 * 0.85 = 1700)
    expect(result.discountedServicePrice).toBe(4500);
    expect(result.discountedProductTotal).toBe(1700);
    expect(result.totalDiscountedPrice).toBe(6200);
    expect(result.totalSavings).toBe(800);
  });

  it('should detect tier upgrade eligibility when spend is close to next tier', () => {
    const result = engine.calculateVipQuote(5000, 0, {
      accountId: 'corp-456',
      tier: 'silver',
      rolling30DaySpend: 14000, // Platinum min is 15000, gold min is 6000. Next tier above silver is gold (min 6000), 14000 >= 6000 * 0.9
      activeEmployeeCount: 40,
      contractTermMonths: 24,
    });

    expect(result.isEligibleForTierUpgrade).toBe(true);
    expect(result.recommendedUpgradeTier).toBe('gold');
  });

  it('should project corporate contract value and LTV accurately', () => {
    const projection = engine.projectCorporateContractValue(
      {
        accountId: 'corp-789',
        tier: 'platinum',
        rolling30DaySpend: 16000,
        activeEmployeeCount: 60,
        contractTermMonths: 36,
      },
      10000,
      3000,
      60
    );

    expect(projection.accountId).toBe('corp-789');
    expect(projection.tier).toBe('platinum');
    expect(projection.annualGrossRevenue).toBeGreaterThan(0);
    expect(projection.projectedLtv).toBeGreaterThan(projection.annualNetProfit);
  });
});
