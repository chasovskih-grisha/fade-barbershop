import { LoyaltyMembershipEngine, CustomerAccount, GiftCard } from '../src/index';

describe('LoyaltyMembershipEngine', () => {
  let engine: LoyaltyMembershipEngine;
  const mockCustomer: CustomerAccount = {
    customerId: 'cust-001',
    name: 'Alex Mercer',
    email: 'alex@example.com',
    pointsBalance: 150,
    lifetimeSpent: 150,
    tier: 'BRONZE',
    completedVisits: 2,
    joinedDate: '2026-01-01'
  };

  const mockGiftCard: GiftCard = {
    cardCode: 'GC-FALL2026',
    initialBalance: 50,
    currentBalance: 50,
    isActive: true,
    expiryDate: '2027-12-31'
  };

  beforeEach(() => {
    engine = new LoyaltyMembershipEngine();
    engine.registerCustomer(mockCustomer);
    engine.registerGiftCard(mockGiftCard);
  });

  test('should calculate correct membership tier based on lifetime spend and visits', () => {
    expect(engine.calculateTier(100, 2)).toBe('BRONZE');
    expect(engine.calculateTier(250, 4)).toBe('SILVER');
    expect(engine.calculateTier(600, 10)).toBe('GOLD');
    expect(engine.calculateTier(1200, 18)).toBe('PLATINUM');
    expect(engine.calculateTier(2500, 30)).toBe('BLACK');
  });

  test('should process checkout successfully with reward redemption and point accrual', () => {
    // Alex has 150 points, redeems REW-1 ($10 off, costs 100 points, minSpend $30)
    const result = engine.processCheckout({
      customerId: 'cust-001',
      serviceTotal: 45.00,
      appliedRewardId: 'REW-1'
    });

    expect(result.originalTotal).toBe(45.00);
    expect(result.pointsRedeemed).toBe(100);
    expect(result.discountAmount).toBe(10.00);
    expect(result.finalTotal).toBe(35.00);
    // Points earned on $35 final total at Bronze tier (10 pts/$1) = 350 pts
    // Remaining points: 150 - 100 + 350 = 400
    expect(result.pointsEarned).toBe(350);
    expect(result.newPointsBalance).toBe(400);
    // Lifetime spent: 150 + 35 = 185, visits: 3 -> SILVER tier
    expect(result.newTier).toBe('SILVER');
  });

  test('should process checkout with gift card deduction and tier multiplier', () => {
    // Elevate customer to GOLD tier first
    const cust = engine.getCustomer('cust-001')!;
    cust.tier = 'GOLD';
    cust.pointsBalance = 300;

    // Service total $60, gift card $50
    const result = engine.processCheckout({
      customerId: 'cust-001',
      serviceTotal: 60.00,
      giftCardCode: 'GC-FALL2026'
    });

    expect(result.originalTotal).toBe(60.00);
    expect(result.giftCardDeduction).toBe(50.00);
    expect(result.finalTotal).toBe(10.00);
    // Final total $10, Gold multiplier = 1.5 -> 10 * 10 * 1.5 = 150 points earned
    expect(result.pointsEarned).toBe(150);
    expect(result.newPointsBalance).toBe(300 - 0 + 150);
  });

  test('should throw error when reward minimum spend is not met', () => {
    expect(() => {
      engine.processCheckout({
        customerId: 'cust-001',
        serviceTotal: 20.00,
        appliedRewardId: 'REW-1' // minSpend is 30
      });
    }).toThrow('Minimum spend of $30 required for this reward');
  });

  test('should throw error when points balance is insufficient', () => {
    expect(() => {
      engine.processCheckout({
        customerId: 'cust-001',
        serviceTotal: 50.00,
        appliedRewardId: 'REW-3' // costs 250 points, customer has 150
      });
    }).toThrow('Insufficient points for reward');
  });
});
