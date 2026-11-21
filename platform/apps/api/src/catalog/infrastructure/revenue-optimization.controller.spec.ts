import { Test, TestingModule } from '@nestjs/testing';
import { RevenueOptimizationController } from './revenue-optimization.controller';

describe('RevenueOptimizationController', () => {
  let controller: RevenueOptimizationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RevenueOptimizationController],
    }).compile();

    controller = module.get<RevenueOptimizationController>(RevenueOptimizationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get dynamic price quote', () => {
    const result = controller.getDynamicPriceQuote(
      '1000',
      '2026-11-14T14:00:00',
      'loc-1',
      undefined,
      'standard',
      'false'
    );
    expect(result.pricingTier).toBe('peak');
    expect(result.finalPrice).toBe(1150);
  });

  it('should evaluate bundle discounts', () => {
    const result = controller.evaluateBundles({
      selectedServiceIds: ['service-haircut', 'service-beard-trim'],
      basePrices: { 'service-haircut': 800, 'service-beard-trim': 500 },
    });
    expect(result.appliedBundleName).toBe('Executive Grooming Combo');
    expect(result.optimizedPrice).toBe(1105);
  });

  it('should get add-on recommendations', () => {
    const result = controller.getAddOns('service-haircut');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should calculate tiered add-on discounts', () => {
    const result = controller.tieredAddOnDiscount({ addOnCount: 2, baseAddOnTotal: 1000 });
    expect(result.tierApplied).toBe('tier_2');
    expect(result.discountPercentage).toBe(15);
    expect(result.finalAddOnTotal).toBe(850);
  });

  it('should calculate group booking discounts', () => {
    const result = controller.groupBookingDiscount({ baseTotal: 4000, partySize: 4 });
    expect(result.isGroupEligible).toBe(true);
    expect(result.discountPercentage).toBe(10);
    expect(result.finalTotal).toBe(3600);
  });

  it('should calculate subscription pass value', () => {
    const result = controller.subscriptionPassValue({
      passRule: {
        passName: 'VIP Pass',
        monthlyFee: 1800,
        includedVisitsPerMonth: 2,
        discountOnAdditionalServices: 10,
      },
      expectedMonthlyUsage: [{ serviceId: 'service-haircut', basePrice: 1000, visits: 3 }],
    });
    expect(result.isPassEconomicalForClient).toBe(true);
    expect(result.passName).toBe('VIP Pass');
  });

  it('should calculate barber tier price', () => {
    const result = controller.barberTierPrice('1000', 'master');
    expect(result.finalPrice).toBe(1400);
    expect(result.tier).toBe('master');
  });

  it('should calculate early bird price', () => {
    const result = controller.earlyBirdPrice('1000', '2026-11-11T08:30:00');
    expect(result.isEarlyBirdEligible).toBe(true);
    expect(result.finalPrice).toBe(880);
  });
});
