import { WinBackEngine } from './domain/win-back-engine.entity';

describe('WinBack Reactivation Engine', () => {
  it('categorizes recent lapse (30-59 days) correctly', () => {
    const rule = WinBackEngine.evaluateDormancy(45);
    expect(rule.dormancyTier).toBe('RECENT_LAPSE');
    expect(rule.reactivationDiscountPercentage).toBe(15);
    expect(rule.recommendedChannel).toBe('SMS');
  });

  it('categorizes dormant clients (60-89 days) with perks', () => {
    const rule = WinBackEngine.evaluateDormancy(75);
    expect(rule.dormancyTier).toBe('DORMANT');
    expect(rule.reactivationDiscountPercentage).toBe(20);
    expect(rule.complimentaryPerk).toBeDefined();
  });

  it('categorizes churned clients (90+ days) with premium reactivation', () => {
    const rule = WinBackEngine.evaluateDormancy(120);
    expect(rule.dormancyTier).toBe('CHURNED');
    expect(rule.reactivationDiscountPercentage).toBe(25);
    expect(rule.recommendedChannel).toBe('WHATSAPP');
  });

  it('generates personalized reactivation message', () => {
    const { rule, message } = WinBackEngine.generateMessage('Alex', 75);
    expect(rule.dormancyTier).toBe('DORMANT');
    expect(message).toContain('Alex');
    expect(message).toContain('75 days');
    expect(message).toContain('20% off');
  });
});
