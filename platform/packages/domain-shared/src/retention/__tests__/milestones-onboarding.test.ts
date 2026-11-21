import { RetentionEngine } from '../engine';

describe('RetentionEngine milestones and onboarding', () => {
  const engine = new RetentionEngine();

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
