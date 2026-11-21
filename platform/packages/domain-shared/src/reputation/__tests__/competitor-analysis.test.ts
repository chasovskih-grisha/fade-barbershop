import { ReputationEngine } from '../engine';
import { mockCompetitors } from '../test-fixtures';

describe('ReputationEngine competitor analysis', () => {
  const engine = new ReputationEngine();

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

    expect(analysis.fadeReviewGrowthVelocity).toBe(18.3);
    expect(analysis.marketLeader).toBe('FADE Platform');
    expect(analysis.competitiveRank).toBe(1);
    expect(analysis.threatLevel).toBe('low');
    expect(analysis.fadeMarketShareOfVoice).toBeGreaterThan(40);
  });

  it('generates a competitor action plan', () => {
    const actionPlan = engine.generateCompetitorActionPlan({
      fadeAverageRating: 4.8,
      marketAverageRating: 4.4,
      unrepliedNegativeCount: 1,
      competitors: mockCompetitors,
    });

    expect(actionPlan.strategicPriority).toBe('High');
    expect(actionPlan.actionItems.length).toBeGreaterThan(0);
  });

  it('analyzes competitor pricing matrix and pricing power correctly', () => {
    const pricingResult = engine.analyzeCompetitorPricingMatrix({
      fadeAverageHaircutPrice: 35,
      fadeAverageRating: 4.8,
      competitors: [
        {
          competitorName: 'Gentlemen Club',
          averageHaircutPrice: 30,
          rating: 4.5,
          positioning: 'mid-market',
        },
        {
          competitorName: 'Sharp & Co.',
          averageHaircutPrice: 40,
          rating: 4.3,
          positioning: 'luxury',
        },
      ],
    });

    expect(pricingResult.marketAveragePrice).toBe(35);
    expect(pricingResult.priceDeltaVsMarket).toBe(0);
    expect(pricingResult.positioningCategory).toBeDefined();
    expect(pricingResult.recommendation).toBeDefined();
  });
});
