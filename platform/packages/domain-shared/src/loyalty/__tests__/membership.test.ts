import { LoyaltyEngine } from '../engine';
import { LoyaltyAccount } from '../types';

describe('LoyaltyEngine VIP perks and membership upgrades', () => {
  const engine = new LoyaltyEngine();

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
