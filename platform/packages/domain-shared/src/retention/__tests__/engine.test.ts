import { RetentionEngine } from '../engine';

describe('RetentionEngine', () => {
  const engine = new RetentionEngine();

  describe('calculateWinBackOffer', () => {
    it('returns ineligible for active clients (<30 days)', () => {
      const result = engine.calculateWinBackOffer({
        clientId: 'cli_123',
        lastVisitDate: '2026-11-01T10:00:00Z',
        currentDate: '2026-11-10T10:00:00Z',
        previousVisitsCount: 3,
      });

      expect(result.eligible).toBe(false);
      expect(result.tier).toBe('active');
      expect(result.discountPercentage).toBe(0);
    });

    it('calculates 30-day win-back offer correctly', () => {
      const result = engine.calculateWinBackOffer({
        clientId: 'cli_123',
        lastVisitDate: '2026-10-01T10:00:00Z',
        currentDate: '2026-11-05T10:00:00Z', // 35 days
        previousVisitsCount: 2,
      });

      expect(result.eligible).toBe(true);
      expect(result.tier).toBe('30_days');
      expect(result.discountPercentage).toBe(15);
      expect(result.promoCode).toBe('WNB-CLI_12-15');
    });

    it('calculates 90+ day VIP win-back offer with bonus perk', () => {
      const result = engine.calculateWinBackOffer({
        clientId: 'cli_999',
        lastVisitDate: '2026-07-01T10:00:00Z',
        currentDate: '2026-11-01T10:00:00Z', // 123 days
        previousVisitsCount: 5,
      });

      expect(result.eligible).toBe(true);
      expect(result.tier).toBe('90_plus_days');
      expect(result.discountPercentage).toBe(30);
      expect(result.bonusPerk).toBeDefined();
    });
  });

  describe('validateReferral', () => {
    it('rejects self-referrals', () => {
      const result = engine.validateReferral({
        referrerId: 'cli_111',
        refereeId: 'cli_111',
        referralCode: 'FADE2026',
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('self_referral_prohibited');
    });

    it('validates legitimate referrals successfully', () => {
      const result = engine.validateReferral({
        referrerId: 'cli_111',
        refereeId: 'cli_222',
        referralCode: 'FADE-CLI_11',
      });

      expect(result.valid).toBe(true);
      expect(result.refereeDiscountPct).toBe(20);
      expect(result.referrerRewardBonus).toBe(15);
    });
  });

  describe('calculateMilestones', () => {
    it('calculates tier and retention score correctly', () => {
      const result = engine.calculateMilestones({
        clientId: 'cli_444',
        completedVisits: 12,
        totalSpent: 450,
        lastVisitDaysAgo: 10,
      });

      expect(result.currentTier).toBe('gold');
      expect(result.milestoneBonusAvailable).toBe(false);
      expect(result.retentionScore).toBeGreaterThan(50);
    });

    it('flags milestone bonus available on 5th visit', () => {
      const result = engine.calculateMilestones({
        clientId: 'cli_555',
        completedVisits: 5,
        totalSpent: 175,
        lastVisitDaysAgo: 3,
      });

      expect(result.currentTier).toBe('silver');
      expect(result.milestoneBonusAvailable).toBe(true);
    });
  });

  describe('calculateOnboardingSequence', () => {
    it('returns welcome stage for day 2 client', () => {
      const result = engine.calculateOnboardingSequence({
        clientId: 'cli_new',
        clientName: 'Alex',
        registrationDate: '2026-11-10T10:00:00Z',
        completedFirstVisit: false,
        daysSinceRegistration: 2,
      });

      expect(result.currentStage).toBe('welcome');
      expect(result.nextScheduledStep?.stepDay).toBe(7);
      expect(result.availableSteps.length).toBe(3);
    });

    it('returns referral prompt stage for day 15 client', () => {
      const result = engine.calculateOnboardingSequence({
        clientId: 'cli_loyal',
        clientName: 'Max',
        registrationDate: '2026-10-25T10:00:00Z',
        completedFirstVisit: true,
        daysSinceRegistration: 15,
      });

      expect(result.currentStage).toBe('referral_prompt');
      expect(result.nextScheduledStep).toBeUndefined();
    });
  });

  describe('calculateReferralTier', () => {
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
  });

  describe('calculateSmartReferralBooster', () => {
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

  describe('calculateRetentionStreak', () => {
    it('calculates retention streak multiplier and perks for standard client with 4 visits', () => {
      const result = engine.calculateRetentionStreak({
        clientId: 'cli_streak_1',
        consecutiveOnTimeVisits: 4,
        currentTier: 'standard',
      });

      expect(result.streakBonusMultiplier).toBe(1.2);
      expect(result.unlockedPerks).toContain('Complimentary beverage');
      expect(result.loyaltyMultiplierCredits).toBe(25);
    });

    it('calculates higher multiplier and VIP perks for loyal VIP client with 7 visits', () => {
      const result = engine.calculateRetentionStreak({
        clientId: 'cli_streak_2',
        consecutiveOnTimeVisits: 7,
        currentTier: 'vip',
      });

      expect(result.streakBonusMultiplier).toBe(1.5);
      expect(result.unlockedPerks).toContain('Free Beard Trim upgrade');
      expect(result.unlockedPerks).toContain('VIP Concierge Access');
      expect(result.loyaltyMultiplierCredits).toBe(75);
    });
  });

  describe('calculateBirthdayAnniversaryIncentive', () => {
    it('calculates birthday voucher and anniversary credits for eligible client', () => {
      const result = engine.calculateBirthdayAnniversaryIncentive({
        clientId: 'cli_bday_123',
        clientName: 'Oleksandr',
        membershipMonths: 12,
        totalVisits: 14,
        isBirthdayMonth: true,
        isAnniversaryMonth: true,
      });

      expect(result.eligibleForBirthdayBonus).toBe(true);
      expect(result.eligibleForAnniversaryBonus).toBe(true);
      expect(result.birthdayVoucherCode).toContain('BDAY-CLI_BD');
      expect(result.anniversaryBonusCreditUah).toBe(250);
      expect(result.vipConciergeUnlocked).toBe(true);
      expect(result.recommendedPerks).toContain('Free Professional Beard Grooming or Scalp Treatment');
    });

    it('returns no bonus when neither birthday nor anniversary month', () => {
      const result = engine.calculateBirthdayAnniversaryIncentive({
        clientId: 'cli_normal',
        clientName: 'Ivan',
        membershipMonths: 5,
        totalVisits: 3,
        isBirthdayMonth: false,
        isAnniversaryMonth: false,
      });

      expect(result.eligibleForBirthdayBonus).toBe(false);
      expect(result.eligibleForAnniversaryBonus).toBe(false);
      expect(result.birthdayVoucherCode).toBe('');
      expect(result.anniversaryBonusCreditUah).toBe(0);
      expect(result.vipConciergeUnlocked).toBe(false);
    });
  });
});
