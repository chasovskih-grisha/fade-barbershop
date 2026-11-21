import type { ReputationSummaryRequest, ReputationSummaryResult, SentimentType } from './types';
import { classifySentiment } from './sentiment';

function emptySummary(): ReputationSummaryResult {
  return {
    totalReviews: 0,
    averageRating: 0.0,
    sentimentBreakdown: {
      positiveCount: 0,
      neutralCount: 0,
      negativeCount: 0,
      positivePercentage: 0,
    },
    responseMetrics: { repliedCount: 0, pendingCount: 0, responseRatePct: 0 },
    escalationRequiredCount: 0,
    competitiveComparison: {
      fadeRating: 0.0,
      marketAverageRating: 0.0,
      ratingDeltaVsMarket: 0.0,
    },
  };
}

interface SentimentCounters {
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  repliedCount: number;
  escalationRequiredCount: number;
}

function countReviews(reviews: ReputationSummaryRequest['reviews']): SentimentCounters {
  const counters: SentimentCounters = {
    positiveCount: 0,
    neutralCount: 0,
    negativeCount: 0,
    repliedCount: 0,
    escalationRequiredCount: 0,
  };

  for (const review of reviews) {
    const sentiment: SentimentType = classifySentiment(review.rating, review.comment);
    if (sentiment === 'positive') counters.positiveCount++;
    else if (sentiment === 'negative') {
      counters.negativeCount++;
      if (!review.replied) counters.escalationRequiredCount++;
    } else {
      counters.neutralCount++;
    }
    if (review.replied) counters.repliedCount++;
  }

  return counters;
}

/**
 * Calculate aggregated reputation metrics, sentiment breakdown, and competitive comparisons.
 */
export function calculateSummary(request: ReputationSummaryRequest): ReputationSummaryResult {
  const reviews = request.reviews || [];
  const totalReviews = reviews.length;
  if (totalReviews === 0) return emptySummary();

  const totalRatingSum = reviews.reduce((acc, review) => acc + review.rating, 0);
  const averageRating = parseFloat((totalRatingSum / totalReviews).toFixed(1));
  const counters = countReviews(reviews);
  const benchmarks = request.competitorBenchmarks || [];
  const marketAvg =
    benchmarks.length > 0
      ? benchmarks.reduce((acc, benchmark) => acc + benchmark.rating, 0) / benchmarks.length
      : averageRating;
  const marketAverageRating = parseFloat(marketAvg.toFixed(1));

  return {
    totalReviews,
    averageRating,
    sentimentBreakdown: {
      positiveCount: counters.positiveCount,
      neutralCount: counters.neutralCount,
      negativeCount: counters.negativeCount,
      positivePercentage: Math.round((counters.positiveCount / totalReviews) * 100),
    },
    responseMetrics: {
      repliedCount: counters.repliedCount,
      pendingCount: totalReviews - counters.repliedCount,
      responseRatePct: Math.round((counters.repliedCount / totalReviews) * 100),
    },
    escalationRequiredCount: counters.escalationRequiredCount,
    competitiveComparison: {
      fadeRating: averageRating,
      marketAverageRating,
      ratingDeltaVsMarket: parseFloat((averageRating - marketAverageRating).toFixed(1)),
    },
  };
}
