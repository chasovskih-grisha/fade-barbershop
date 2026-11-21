import {
  ReputationEngine,
  type CompetitorPricingInput,
  type ReviewInput,
} from '@fade/domain-shared';
import { ALERT_RULES, INITIAL_BENCHMARKS } from './reputation-data';

const engine = new ReputationEngine();
const COMPETITORS = [
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
];
const PRICING_COMPETITORS: CompetitorPricingInput[] = [
  {
    competitorName: "Gentlemen's Club",
    averageHaircutPrice: 42,
    rating: 4.5,
    positioning: 'luxury',
  },
  {
    competitorName: 'Sharp & Co.',
    averageHaircutPrice: 35,
    rating: 4.3,
    positioning: 'mid-market',
  },
];

export function analyzeReputation(reviews: ReviewInput[]) {
  const summary = engine.calculateSummary({ reviews, competitorBenchmarks: INITIAL_BENCHMARKS });
  const velocityAnalysis = engine.analyzeCompetitorVelocity({
    fadeMonthlyReviews: [18, 22, 25],
    fadeAverageRating: summary.averageRating,
    competitors: COMPETITORS,
  });
  const topicAnalysis = engine.analyzeReviewTopics(reviews);
  const actionPlan = engine.generateCompetitorActionPlan({
    fadeAverageRating: summary.averageRating,
    marketAverageRating: summary.competitiveComparison.marketAverageRating,
    unrepliedNegativeCount: summary.escalationRequiredCount,
    competitors: INITIAL_BENCHMARKS,
  });
  const sentimentAlerts = engine.evaluateSentimentAlerts(reviews, ALERT_RULES);
  const pricingMatrix = engine.analyzeCompetitorPricingMatrix({
    fadeAverageHaircutPrice: 38,
    fadeAverageRating: 4.96,
    competitors: PRICING_COMPETITORS,
  });
  const trendForecast = engine.forecastSentimentTrend({
    monthlyAverageRatings: [4.6, 4.7, 4.8],
    monthlyReviewCounts: [15, 20, 25],
  });

  return {
    summary,
    velocityAnalysis,
    topicAnalysis,
    actionPlan,
    sentimentAlerts,
    pricingMatrix,
    trendForecast,
    classify: (review: ReviewInput) => engine.classifySentiment(review.rating, review.comment),
    autoReply: (review: ReviewInput) =>
      engine.generateAutoReply({
        reviewId: review.id,
        clientName: review.clientName,
        rating: review.rating,
        sentiment: engine.classifySentiment(review.rating, review.comment),
        service: review.service,
        barber: review.barber,
      }),
  };
}

export type ReputationAnalytics = ReturnType<typeof analyzeReputation>;
