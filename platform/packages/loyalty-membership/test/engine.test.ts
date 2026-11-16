import { LoyaltyMembershipEngine, LoyaltyMember } from '../src';

describe('LoyaltyMembershipEngine', () => {
  let engine: LoyaltyMembershipEngine;
  let testMember: LoyaltyMember;

  beforeEach(() => {
    engine = new LoyaltyMembershipEngine();
    testMember = {
      id: 'mem_123',
      name: 'Alex Sterling',
      email: 'alex@example.com',
      tier: 'BRONZE',
      pointsBalance: 500,
      lifetimePointsEarned: 900,
      totalSpent: 350,
      visitCount: 4,
      joinedDate: new Date('2026-01-01')
    };
  });

  test('evaluates loyalty tiers correctly based on lifetime points and spend', () => {
    expect(engine.evaluateTier(testMember)).toBe('GOLD'); // 900 points & $350 spend -> GOLD (>= 800 points or >= 300 spend).
    
    testMember.lifetimePointsEarned = 1600;
    testMember.totalSpent = 700;
    expect(engine.evaluateTier(testMember)).toBe('PLATINUM'); // >= 1500 points or >= 600 spend for PLATINUM.
  });

  test('calculates points earned based on tier multipliers', () => {
    expect(engine.calculatePointsEarned('BRONZE', 50)).toBe(500);
    expect(engine.calculatePointsEarned('VIP', 50)).toBe(1000);
  });

  test('processes checkout with membership plan, point redemption, and birthday bonus', () => {
    testMember.activeMembershipId = 'plan_gold';
    testMember.pointsBalance = 500;

    const result = engine.processCheckout(testMember, {
      memberId: testMember.id,
      subtotal: 100,
      serviceCodes: ['SIGNATURE_CUT'],
      pointsToRedeem: 200,
      isBirthdayBonusEligible: true
    });

    expect(result.subtotal).toBe(100);
    expect(result.discountAmount).toBe(35); // 15% plan discount ($15) + 200 points ($20) = $35
    expect(result.pointsRedeemed).toBe(200);
    expect(result.birthdayBonusPoints).toBe(500);
    expect(result.finalTotal).toBe(65);
    expect(result.tierApplied).toBe('GOLD');
    expect(result.perksApplied).toContain('Birthday Bonus: +500 Bonus Points Awarded!');
  });

  test('processes customer referral correctly', () => {
    const ref = engine.processReferral('mem_123', 'mem_999');
    expect(ref.referrerMemberId).toBe('mem_123');
    expect(ref.referredMemberId).toBe('mem_999');
    expect(ref.rewardPointsGranted).toBe(250);
    expect(ref.status).toBe('COMPLETED');
  });

  test('manages gift card creation and redemption', () => {
    const gc = engine.createGiftCard(75, 'Alex');
    expect(gc.initialBalance).toBe(75);
    expect(gc.currentBalance).toBe(75);

    const success = engine.redeemGiftCard(gc.code, 25);
    expect(success).toBe(true);

    const gcUpdated = engine['giftCards'].get(gc.code);
    expect(gcUpdated?.currentBalance).toBe(50);
    expect(gcUpdated?.isRedeemed).toBe(false);
  });
});
