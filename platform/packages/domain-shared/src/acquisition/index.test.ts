import { evaluateRetentionProfile, REFERRAL_TIERS, generateReferralCode, generateWinbackCampaign } from './index';

describe('Customer Acquisition & Retention Specialist Module', () => {
  test('calculates churn risk correctly for inactive clients', () => {
    const profile = evaluateRetentionProfile('client-123', 1, 45, 600);
    expect(profile.churnRiskScore).toBeGreaterThan(0.8);
    expect(profile.recommendedAction).toBe('winback_discount');
  });

  test('recommends referral invite for active clients with low churn risk', () => {
    const profile = evaluateRetentionProfile('client-456', 4, 10, 2200);
    expect(profile.churnRiskScore).toBeLessThan(0.3);
    expect(profile.tier).toBe('silver');
    expect(profile.recommendedAction).toBe('referral_invite');
  });

  test('generates valid branded FADE referral code', () => {
    const code = generateReferralCode('user-abc-789');
    expect(code.startsWith('FADE-')).toBe(true);
    expect(code.length).toBeGreaterThan(8);
  });

  test('has correct referral tiers defined', () => {
    expect(REFERRAL_TIERS.length).toBeGreaterThan(0);
    const tier = REFERRAL_TIERS[1];
    if (tier) {
      expect(tier.requiredReferrals).toBe(3);
      expect(tier.vipPerksUnlocked).toBe(true);
    }
  });

  test('generates personalized winback campaign with discount and optional perks', () => {
    const profile = evaluateRetentionProfile('client-789', 5, 65, 3000);
    const campaign = generateWinbackCampaign(profile);
    expect(campaign.discountPercent).toBe(30);
    expect(campaign.discountVoucherCode.startsWith('COMEBACK-')).toBe(true);
    expect(campaign.freeServiceAddon).toBeDefined();
  });
});
