import { RetentionEngine } from '../engine';

describe('RetentionEngine referral incentives', () => {
  const engine = new RetentionEngine();

  it('calculates bronze tier for 1 referral', () => {
    const result = engine.calculateReferralTier({
      referrerId: 'cli_ref',
      successfulReferralsCount: 1,
    });

    expect(result.tierLevel).toBe('bronze');
    expect(result.rewardAmountPerReferral).toBe(15);
    expect(result.nextTierThreshold).toBe(3);
  });

  it('calculates gold tier for 10 referrals', () => {
    const result = engine.calculateReferralTier({
      referrerId: 'cli_ref_vip',
      successfulReferralsCount: 10,
    });

    expect(result.tierLevel).toBe('gold');
    expect(result.rewardAmountPerReferral).toBe(25);
    expect(result.nextTierThreshold).toBe(15);
  });

  it('applies standard referral reward when no boost or weekend active', () => {
    const result = engine.calculateSmartReferralBooster({
      referrerId: 'cli_1',
      baseReward: 20,
      isWeekend: false,
    });

    expect(result.boostActive).toBe(false);
    expect(result.multiplier).toBe(1.0);
    expect(result.boostedReward).toBe(20);
  });

  it('applies weekend booster multiplier correctly', () => {
    const result = engine.calculateSmartReferralBooster({
      referrerId: 'cli_2',
      baseReward: 20,
      isWeekend: true,
    });

    expect(result.boostActive).toBe(true);
    expect(result.multiplier).toBe(1.25);
    expect(result.boostedReward).toBe(25);
  });

  it('applies VIP surge campaign multiplier correctly', () => {
    const result = engine.calculateSmartReferralBooster({
      referrerId: 'cli_3',
      baseReward: 20,
      activeCampaignCode: 'FADE-VIP-SURGE',
    });

    expect(result.boostActive).toBe(true);
    expect(result.multiplier).toBe(1.5);
    expect(result.boostedReward).toBe(30);
  });
});
