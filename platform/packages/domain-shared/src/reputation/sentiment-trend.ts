import type {
  ReviewSentimentTrendForecastRequest,
  ReviewSentimentTrendForecastResult,
} from './types';

type Trajectory = ReviewSentimentTrendForecastResult['trajectory'];

function projectRating(currentRating: number, previousRating: number): number {
  const projected = Number((currentRating + (currentRating - previousRating) * 0.5).toFixed(2));
  if (projected > 5.0) return 5.0;
  if (projected < 1.0) return 1.0;
  return projected;
}

function resolveTrajectory(ratingDelta: number): Trajectory {
  if (ratingDelta > 0.05) return 'improving';
  if (ratingDelta < -0.05) return 'declining';
  return 'stable';
}

function calculateMomentum(counts: number[]): number {
  if (counts.length < 2) return 0;
  const recentCount = counts[counts.length - 1] ?? 0;
  const priorCount = counts[counts.length - 2] ?? 0;
  if (priorCount <= 0) return 0;
  return Math.round(((recentCount - priorCount) / priorCount) * 100);
}

function buildInsights(trajectory: Trajectory, momentum: number): string[] {
  const insights: string[] = [];
  if (trajectory === 'improving') {
    insights.push('Review ratings show positive upward momentum over recent months.');
  } else if (trajectory === 'declining') {
    insights.push(
      'Warning: Rating trajectory is declining. Review recent client feedback for service consistency gaps.'
    );
  } else {
    insights.push('Rating trajectory remains stable and resilient.');
  }

  if (momentum > 15) {
    insights.push(
      `High review acquisition velocity (+${momentum}% MoM), strengthening local SEO ranking.`
    );
  }
  return insights;
}

/**
 * Forecast sentiment trend and review volume momentum for upcoming months.
 */
export function forecastSentimentTrend(
  request: ReviewSentimentTrendForecastRequest
): ReviewSentimentTrendForecastResult {
  const ratings = request.monthlyAverageRatings || [];
  if (ratings.length === 0) {
    return {
      currentRating: 0,
      projectedNextMonthRating: 0,
      trajectory: 'stable',
      reviewMomentumIndex: 0,
      brandLoyaltyScore: 0,
      forecastingInsights: ['Insufficient historical rating data for trend forecasting.'],
    };
  }

  const currentRating = ratings[ratings.length - 1] ?? 0;
  const previousRating =
    ratings.length > 1 ? (ratings[ratings.length - 2] ?? currentRating) : currentRating;
  const trajectory = resolveTrajectory(currentRating - previousRating);
  const reviewMomentumIndex = calculateMomentum(request.monthlyReviewCounts || []);

  return {
    currentRating,
    projectedNextMonthRating: projectRating(currentRating, previousRating),
    trajectory,
    reviewMomentumIndex,
    brandLoyaltyScore: Math.min(
      100,
      Math.max(0, Math.round((currentRating / 5.0) * 80 + Math.min(20, reviewMomentumIndex)))
    ),
    forecastingInsights: buildInsights(trajectory, reviewMomentumIndex),
  };
}
