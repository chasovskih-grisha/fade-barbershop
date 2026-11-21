import type {
  PlatformAttributionAnalysisResult,
  PlatformAttributionSummary,
  ReviewInput,
} from './types';
import { classifySentiment } from './sentiment';

type PlatformName = PlatformAttributionSummary['platform'];

const PLATFORMS: PlatformName[] = ['Google', 'Yelp', 'App Feedback', 'Facebook', 'Instagram'];

function buildSummary(
  platform: PlatformName,
  reviews: ReviewInput[],
  totalReviews: number
): PlatformAttributionSummary {
  const platformReviews = reviews.filter((review) => review.platform === platform);
  const count = platformReviews.length;
  if (count === 0) {
    return {
      platform,
      totalReviews: 0,
      averageRating: 0,
      positiveSentimentPct: 0,
      responseRatePct: 0,
      shareOfReviewsPct: 0,
    };
  }

  const ratingSum = platformReviews.reduce((sum, review) => sum + review.rating, 0);
  const positiveCount = platformReviews.filter(
    (review) => classifySentiment(review.rating, review.comment) === 'positive'
  ).length;
  const repliedCount = platformReviews.filter((review) => review.replied).length;

  return {
    platform,
    totalReviews: count,
    averageRating: Number((ratingSum / count).toFixed(1)),
    positiveSentimentPct: Math.round((positiveCount / count) * 100),
    responseRatePct: Math.round((repliedCount / count) * 100),
    shareOfReviewsPct: totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0,
  };
}

function buildRecommendations(
  summaries: PlatformAttributionSummary[],
  activeCount: number
): string[] {
  const recommendations: string[] = [];
  if (activeCount < 3) {
    recommendations.push(
      'Review acquisition is concentrated on few platforms. Diversify review requests to Yelp and Facebook to improve local search coverage.'
    );
  } else {
    recommendations.push('Healthy multi-platform review distribution supporting robust local SEO.');
  }

  const lowResponse = summaries.find(
    (summary) => summary.responseRatePct < 50 && summary.totalReviews > 0
  );
  if (lowResponse) {
    recommendations.push(
      `Platform "${lowResponse.platform}" has a low response rate (${lowResponse.responseRatePct}%). Increase management response velocity.`
    );
  }
  return recommendations;
}

/**
 * Analyze platform source attribution, ratings, sentiment, response rate, and share of reviews.
 */
export function analyzePlatformAttribution(
  reviews: ReviewInput[]
): PlatformAttributionAnalysisResult {
  const totalReviews = reviews.length;
  const summaries = PLATFORMS.map((platform) => buildSummary(platform, reviews, totalReviews));
  const activePlatforms = summaries
    .filter((summary) => summary.totalReviews > 0)
    .sort((a, b) => b.averageRating - a.averageRating);
  const activeCount = activePlatforms.length;

  return {
    platforms: summaries,
    topPerformingPlatform: activePlatforms[0]?.platform || 'Google',
    sourceDiversificationScore: Math.min(100, activeCount * 25 + (totalReviews >= 10 ? 25 : 0)),
    recommendations: buildRecommendations(summaries, activeCount),
  };
}
