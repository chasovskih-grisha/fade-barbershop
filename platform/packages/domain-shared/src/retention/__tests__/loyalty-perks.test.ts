import { RetentionEngine } from '../engine';

describe('RetentionEngine loyalty perks', () => {
  const engine = new RetentionEngine();

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
    expect(result.recommendedPerks).toContain(
      'Free Professional Beard Grooming or Scalp Treatment'
    );
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
