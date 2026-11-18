import { LoyaltyEngine } from '../engine';
import { LoyaltyAccount } from '../types';

describe('LoyaltyEngine', () => {
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

    // 40 * 10 * 1.25 (500) + 500 (birthday) + 250 (referral) = 1250 (consecutiveVisits was 1, becomes 2, threshold is 3 so no streak bonus yet)
    expect(result.pointsEarned).toBe(1250);
    expect(result.newPointsTotal).toBe(1350);
    expect(result.newLifetimePoints).toBe(2450);
    expect(result.newTier).toBe('SILVER');
    expect(result.bonusApplied).toContain('BIRTHDAY_BONUS');
    expect(result.bonusApplied).toContain('REFERRAL_BONUS');
    expect(result.bonusApplied).not.toContain('STREAK_BONUS');
    expect(result.newConsecutiveVisits).toBe(2);
  });

  test('redeems points for purchase discount correctly', () => {
    const account: LoyaltyAccount = {
      customerId: 'cust-1',
      points: 2000,
      lifetimePoints: 5000,
      tier: 'GOLD',
      giftCardBalanceCents: 0,
      joinDate: '2025-01-01',
    };

    const result = engine.redeemPoints({
      account,
      pointsToRedeem: 1500,
      purchaseAmountCents: 5000,
    });

    expect(result.discountCents).toBe(1500);
    expect(result.remainingPoints).toBe(500);
  });

  test('caps point discount at purchase amount', () => {
    const account: LoyaltyAccount = {
      customerId: 'cust-1',
      points: 5000,
      lifetimePoints: 5000,
      tier: 'GOLD',
      giftCardBalanceCents: 0,
      joinDate: '2025-01-01',
    };

    const result = engine.redeemPoints({
      account,
      pointsToRedeem: 4000,
      purchaseAmountCents: 2500,
    });

    expect(result.discountCents).toBe(2500);
    expect(result.remainingPoints).toBe(2500);
  });

  test('throws on insufficient points', () => {
    const account: LoyaltyAccount = {
      customerId: 'cust-1',
      points: 100,
      lifetimePoints: 100,
      tier: 'BRONZE',
      giftCardBalanceCents: 0,
      joinDate: '2025-01-01',
    };

    expect(() => {
      engine.redeemPoints({
        account,
        pointsToRedeem: 500,
        purchaseAmountCents: 1000,
      });
    }).toThrow('Insufficient loyalty points');
  });

  test('evaluates VIP perks correctly', () => {
    const vipAccount: LoyaltyAccount = {
      customerId: 'cust-vip',
      points: 40000,
      lifetimePoints: 40000,
      tier: 'VIP',
      giftCardBalanceCents: 10000,
      joinDate: '2024-01-01',
    };

    const perks = engine.evaluateVIPPerks({
      account: vipAccount,
      serviceCategory: 'Haircut & Beard',
      isPeakHour: true,
    });

    expect(perks.discountPercent).toBe(15);
    expect(perks.priorityBookingGranted).toBe(true);
    expect(perks.complimentaryUpgradeEligible).toBe(true);
  });

  test('upgrades membership tier successfully when sufficient payment is provided', () => {
    const account: LoyaltyAccount = {
      customerId: 'cust-2',
      points: 500,
      lifetimePoints: 600,
      tier: 'BRONZE',
      giftCardBalanceCents: 0,
      joinDate: '2025-01-01',
    };

    const result = engine.upgradeMembership({
      account,
      targetTier: 'GOLD',
      paymentCents: 15000,
    });

    expect(result.upgraded).toBe(true);
    expect(result.account.tier).toBe('GOLD');
    expect(result.account.lifetimePoints).toBe(5000);
  });

  test('throws on insufficient payment for membership upgrade', () => {
    const account: LoyaltyAccount = {
      customerId: 'cust-3',
      points: 0,
      lifetimePoints: 0,
      tier: 'BRONZE',
      giftCardBalanceCents: 0,
      joinDate: '2025-01-01',
    };

    expect(() => {
      engine.upgradeMembership({
        account,
        targetTier: 'GOLD',
        paymentCents: 5000,
      });
    }).toThrow('Insufficient payment for tier upgrade');
  });
});

