import { ReputationEngine } from '../engine';
import { ReviewInput, CompetitorBenchmark } from '../types';

describe('ReputationEngine', () => {
  const engine = new ReputationEngine();

  const mockReviews: ReviewInput[] = [
    {
      id: 'rev-1',
      clientName: 'Alexander Wright',
      service: 'Executive Fade',
      barber: 'Dmytro K.',
      rating: 5,
      comment: 'Absolute masterclass! Dmytro understood exactly what shape I needed.',
      date: '2026-11-10',
      platform: 'Google',
      replied: true,
    },
    {
      id: 'rev-2',
      clientName: 'Viktor Hnativ',
      service: 'Beard Sculpting',
      barber: 'Oleg M.',
      rating: 2,
      comment: 'Trimmed too short on the left side. Disappointed with symmetry.',
      date: '2026-11-08',
      platform: 'App Feedback',
      replied: false,
    },
    {
      id: 'rev-3',
      clientName: 'Max Taylor',
      service: 'Classic Haircut',
      barber: 'Andriy S.',
      rating: 3,
      comment: 'It was okay, decent haircut.',
      date: '2026-11-09',
      platform: 'Yelp',
      replied: true,
    },
  ];

  const mockCompetitors: CompetitorBenchmark[] = [
    { competitorName: 'Gentlemen Club', rating: 4.5, reviewCount: 120, responseRatePct: 45, avgReplyHours: 12 },
    { competitorName: 'Sharp & Co.', rating: 4.3, reviewCount: 95, responseRatePct: 30, avgReplyHours: 24 },
  ];

  it('calculates reputation summary metrics correctly', () => {
    const summary = engine.calculateSummary({
      reviews: mockReviews,
      competitorBenchmarks: mockCompetitors,
    });

    expect(summary.totalReviews).toBe(3);
    expect(summary.averageRating).toBe(3.3); // (5 + 2 + 3) / 3 = 3.33 -> 3.3
    expect(summary.sentimentBreakdown.positiveCount).toBe(1);
    expect(summary.sentimentBreakdown.negativeCount).toBe(1);
    expect(summary.sentimentBreakdown.neutralCount).toBe(1);
    expect(summary.responseMetrics.repliedCount).toBe(2);
    expect(summary.responseMetrics.pendingCount).toBe(1);
    expect(summary.escalationRequiredCount).toBe(1); // unreplied negative review
    expect(summary.competitiveComparison.marketAverageRating).toBe(4.4);
  });

  it('classifies sentiment accurately', () => {
    expect(engine.classifySentiment(5, 'Amazing work!')).toBe('positive');
    expect(engine.classifySentiment(1, 'Terrible service and rude staff.')).toBe('negative');
    expect(engine.classifySentiment(3, 'It was average.')).toBe('neutral');
    expect(engine.classifySentiment(3, 'Very disappointed with the wait time.')).toBe('negative');
  });

  it('generates appropriate auto-reply and escalation flags', () => {
    const positiveReply = engine.generateAutoReply({
      reviewId: 'rev-1',
      clientName: 'Alexander Wright',
      rating: 5,
      sentiment: 'positive',
      service: 'Executive Fade',
      barber: 'Dmytro K.',
    });
    expect(positiveReply.priority).toBe('low');
    expect(positiveReply.requiresEscalationToAdmin).toBe(false);
    expect(positiveReply.suggestedReply).toContain('Alexander');

    const negativeReply = engine.generateAutoReply({
      reviewId: 'rev-2',
      clientName: 'Viktor Hnativ',
      rating: 2,
      sentiment: 'negative',
      service: 'Beard Sculpting',
      barber: 'Oleg M.',
    });
    expect(negativeReply.priority).toBe('urgent');
    expect(negativeReply.requiresEscalationToAdmin).toBe(true);
    expect(negativeReply.suggestedReply).toContain('apologize');
  });

  it('analyzes competitor review velocity and market share correctly', () => {
    const analysis = engine.analyzeCompetitorVelocity({
      fadeMonthlyReviews: [15, 18, 22],
      fadeAverageRating: 4.7,
      competitors: [
        {
          competitorName: "Gentlemen's Club",
          monthlyReviews: [10, 12, 14],
          averageRating: 4.5,
          sentimentScore: 85,
        },
        {
          competitorName: 'Sharp & Co.',
          monthlyReviews: [8, 9, 10],
          averageRating: 4.3,
          sentimentScore: 78,
        },
      ],
    });

    expect(analysis.fadeReviewGrowthVelocity).toBe(18.3); // (15+18+22)/3 = 18.33 -> 18.3
    expect(analysis.marketLeader).toBe('FADE Platform');
    expect(analysis.competitiveRank).toBe(1);
    expect(analysis.threatLevel).toBe('low');
    expect(analysis.fadeMarketShareOfVoice).toBeGreaterThan(40);
  });

  it('clusters review sentiment by topic categories correctly', () => {
    const topicAnalysis = engine.analyzeReviewTopics(mockReviews);
    expect(topicAnalysis.topics.length).toBe(5);
    expect(topicAnalysis.topStrength).toBeDefined();
    expect(topicAnalysis.primaryImprovementArea).toBeDefined();
  });

  it('generates competitor action plan and evaluates sentiment alerts correctly', () => {
    const actionPlan = engine.generateCompetitorActionPlan({
      fadeAverageRating: 4.8,
      marketAverageRating: 4.4,
      unrepliedNegativeCount: 1,
      competitors: mockCompetitors,
    });
    expect(actionPlan.strategicPriority).toBe('High');
    expect(actionPlan.actionItems.length).toBeGreaterThan(0);

    const alerts = engine.evaluateSentimentAlerts(mockReviews, [
      { id: 'rule-1', name: 'Low Rating Alert', triggerCondition: 'rating_lte_2', enabled: true, notificationChannel: 'Push' },
      { id: 'rule-2', name: 'Disabled Alert', triggerCondition: 'negative_sentiment', enabled: false, notificationChannel: 'Email' },
    ]);
    expect(alerts.totalTriggered).toBe(1);
    expect(alerts.triggeredAlerts[0]?.ruleId).toBe('rule-1');
  });

  it('analyzes competitor pricing matrix and pricing power correctly', () => {
    const pricingResult = engine.analyzeCompetitorPricingMatrix({
      fadeAverageHaircutPrice: 35,
      fadeAverageRating: 4.8,
      competitors: [
        { competitorName: 'Gentlemen Club', averageHaircutPrice: 30, rating: 4.5, positioning: 'mid-market' },
        { competitorName: 'Sharp & Co.', averageHaircutPrice: 40, rating: 4.3, positioning: 'luxury' },
      ],
    });

    expect(pricingResult.marketAveragePrice).toBe(35);
    expect(pricingResult.priceDeltaVsMarket).toBe(0);
    expect(pricingResult.positioningCategory).toBeDefined();
    expect(pricingResult.recommendation).toBeDefined();
  });

  it('forecasts sentiment trend and review volume momentum correctly', () => {
    const forecast = engine.forecastSentimentTrend({
      monthlyAverageRatings: [4.6, 4.7, 4.8],
      monthlyReviewCounts: [15, 20, 28],
    });

    expect(forecast.currentRating).toBe(4.8);
    expect(forecast.trajectory).toBe('improving');
    expect(forecast.reviewMomentumIndex).toBe(40);
    expect(forecast.brandLoyaltyScore).toBeGreaterThan(80);
    expect(forecast.forecastingInsights.length).toBeGreaterThan(0);
  });

  it('analyzes platform source attribution and cross-platform sentiment correctly', () => {
    const attribution = engine.analyzePlatformAttribution(mockReviews);
    expect(attribution.platforms.length).toBe(5);
    expect(attribution.topPerformingPlatform).toBe('Google');
    expect(attribution.sourceDiversificationScore).toBeGreaterThan(0);
    expect(attribution.recommendations.length).toBeGreaterThan(0);
  });

  it('optimizes review request timing and channel delivery correctly', () => {
    const timingResult = engine.optimizeReviewRequestTiming({
      clientName: 'Alexander Wright',
      service: 'Executive Fade',
      barber: 'Dmytro K.',
      appointmentCompletionHour: 15, // 3 PM
      clientPastVisitsCount: 5, // Loyal client
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
      appointmentCompletionHour: 22, // 10 PM
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
