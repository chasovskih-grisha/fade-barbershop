import { VipAnniversaryBooster, VIP_TIER_RULES } from './domain/vip-anniversary-booster.entity';

describe('VipAnniversaryBooster', () => {
  it('should evaluate correct VIP tier based on spend and visits', () => {
    expect(VipAnniversaryBooster.evaluateVipTier(2000, 3).tier).toBe('SILVER');
    expect(VipAnniversaryBooster.evaluateVipTier(8000, 10).tier).toBe('GOLD');
    expect(VipAnniversaryBooster.evaluateVipTier(18000, 20).tier).toBe('PLATINUM');
    expect(VipAnniversaryBooster.evaluateVipTier(35000, 60).tier).toBe('BLACK');
  });

  it('should generate personalized anniversary message with tier perks', () => {
    const result = VipAnniversaryBooster.generateAnniversaryMessage('Oleksandr', 2, 'GOLD');
    expect(result.discountPercentage).toBe(15); // 10% Gold + 5% anniversary bonus
    expect(result.message).toContain('Happy 2-Year FADE Anniversary, Oleksandr!');
    expect(result.message).toContain('GOLD');
    expect(result.message).toContain('Complimentary Styling Product');
  });
});
