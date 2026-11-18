import { VIPReferralEngine } from './domain/vip-referral-engine.entity';

describe('VIP Referral Multiplier Engine', () => {
  it('calculates correct rewards for Bronze tier', () => {
    const rule = VIPReferralEngine.calculateReward('BRONZE');
    expect(rule.referrerDiscountPercentage).toBe(10);
    expect(rule.refereeDiscountPercentage).toBe(15);
    expect(rule.bonusPoints).toBe(100);
    expect(rule.exclusivePerk).toBeUndefined();
  });

  it('calculates correct rewards for Platinum tier with exclusive perks', () => {
    const rule = VIPReferralEngine.calculateReward('PLATINUM');
    expect(rule.referrerDiscountPercentage).toBe(25);
    expect(rule.refereeDiscountPercentage).toBe(30);
    expect(rule.bonusPoints).toBe(1000);
    expect(rule.exclusivePerk).toContain('Beard Sculpting');
  });

  it('falls back to Bronze for unknown tiers', () => {
    const rule = VIPReferralEngine.calculateReward('UNKNOWN' as any);
    expect(rule.tier).toBe('BRONZE');
    expect(rule.referrerDiscountPercentage).toBe(10);
  });
});
