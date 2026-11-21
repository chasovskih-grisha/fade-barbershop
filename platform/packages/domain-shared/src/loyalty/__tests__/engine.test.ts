import { LoyaltyEngine } from '../engine';
import { LoyaltyAccount } from '../types';

describe('LoyaltyEngine tiers and accrual', () => {
  let engine: LoyaltyEngine;

  beforeEach(() => {
    engine = new LoyaltyEngine();
  });

  test('calculates tiers correctly based on lifetime points', () => {
    expect(engine.calculateTier(0)).toBe('BRONZE');
    expect(engine.calculateTier(999)).toBe('BRONZE');
    expect(engine.calculateTier(1000)).toBe('SILVER');
    expect(engine.calculateTier(4999)).toBe('SILVER');
    expect(engine.calculateTier(5000)).toBe('GOLD');
    expect(engine.calculateTier(15000)).toBe('PLATINUM');
    expect(engine.calculateTier(35000)).toBe('VIP');
  });

  test('accrues points correctly with tier multipliers and birthday bonus', () => {
    const account: LoyaltyAccount = {
      customerId: 'cust-1',
      points: 100,
      lifetimePoints: 1200,
      tier: 'SILVER',
      giftCardBalanceCents: 5000,
      joinDate: '2025-01-01',
      consecutiveVisits: 1,
    };

    const result = engine.accruePoints({
      account,
      spendCents: 4000,
      isBirthday: true,
      isReferral: true,
      completedVisit: true,
    });

    expect(result.pointsEarned).toBe(1250);
    expect(result.newPointsTotal).toBe(1350);
    expect(result.newLifetimePoints).toBe(2450);
    expect(result.newTier).toBe('SILVER');
    expect(result.bonusApplied).toContain('BIRTHDAY_BONUS');
    expect(result.bonusApplied).toContain('REFERRAL_BONUS');
    expect(result.bonusApplied).not.toContain('STREAK_BONUS');
    expect(result.newConsecutiveVisits).toBe(2);
  });
});
