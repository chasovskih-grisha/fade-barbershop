import { RetentionEngine } from '../engine';

describe('RetentionEngine win-back and referral validation', () => {
  const engine = new RetentionEngine();

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
      currentDate: '2026-11-05T10:00:00Z',
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
      currentDate: '2026-11-01T10:00:00Z',
      previousVisitsCount: 5,
    });

    expect(result.eligible).toBe(true);
    expect(result.tier).toBe('90_plus_days');
    expect(result.discountPercentage).toBe(30);
    expect(result.bonusPerk).toBeDefined();
  });

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
