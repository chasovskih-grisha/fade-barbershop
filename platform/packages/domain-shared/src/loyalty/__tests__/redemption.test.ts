import { LoyaltyEngine } from '../engine';
import { LoyaltyAccount } from '../types';

describe('LoyaltyEngine redemption', () => {
  const engine = new LoyaltyEngine();

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
});
