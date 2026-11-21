import { ReputationEngine } from '../engine';
import { mockReviews } from '../test-fixtures';

describe('ReputationEngine trend and attribution', () => {
  const engine = new ReputationEngine();

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
});
