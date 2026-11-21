import { ReputationEngine } from '../engine';

describe('ReputationEngine client lifecycle', () => {
  const engine = new ReputationEngine();

  it('optimizes review request timing and channel delivery correctly', () => {
    const timingResult = engine.optimizeReviewRequestTiming({
      clientName: 'Alexander Wright',
      service: 'Executive Fade',
      barber: 'Dmytro K.',
      appointmentCompletionHour: 15,
      clientPastVisitsCount: 5,
    });

    expect(timingResult.optimalDelayMinutes).toBe(15);
    expect(timingResult.recommendedChannel).toBe('SMS');
    expect(timingResult.predictedConversionRatePct).toBe(68);
    expect(timingResult.predictedPositiveSentimentLikelihoodPct).toBe(94);
    expect(timingResult.rationale).toContain('High loyalty client');

    const offHoursResult = engine.optimizeReviewRequestTiming({
      clientName: 'Max Taylor',
      service: 'Classic Haircut',
      barber: 'Andriy S.',
      appointmentCompletionHour: 22,
      clientPastVisitsCount: 1,
    });

    expect(offHoursResult.optimalDelayMinutes).toBe(720);
    expect(offHoursResult.rationale).toContain('outside business hours');
  });

  it('predicts client churn risk and recommends retention actions correctly', () => {
    const churnPrediction = engine.predictClientChurnRisk({
      clientId: 'client-123',
      clientName: 'Viktor Hnativ',
      recentRating: 1,
      recentComment: 'Terrible haircut and uneven fade. Never coming back.',
      daysSinceLastVisit: 50,
      totalVisitsCount: 2,
      averageSpend: 600,
    });

    expect(churnPrediction.churnRiskScore).toBeGreaterThanOrEqual(75);
    expect(churnPrediction.riskLevel).toBe('Critical');
    expect(churnPrediction.voucherSuggested).toBe(true);
    expect(churnPrediction.voucherAmount).toBeGreaterThan(0);
    expect(churnPrediction.recommendedRetentionAction).toContain('manager outreach');
  });
});
