import type {
  AutoReplyRequest,
  AutoReplyResult,
  ClientChurnRiskPredictionRequest,
  ClientChurnRiskPredictionResult,
  CompetitorActionPlanRequest,
  CompetitorActionPlanResult,
  CompetitorPricingMatrixRequest,
  CompetitorPricingMatrixResult,
  CompetitorVelocityAnalysisRequest,
  CompetitorVelocityAnalysisResult,
  PlatformAttributionAnalysisResult,
  ReputationSummaryRequest,
  ReputationSummaryResult,
  ReviewInput,
  ReviewRequestTimingOptimizationRequest,
  ReviewRequestTimingOptimizationResult,
  ReviewSentimentTrendForecastRequest,
  ReviewSentimentTrendForecastResult,
  SentimentAlertEvaluationResult,
  SentimentAlertRule,
  SentimentType,
  TopicSentimentAnalysisResult,
} from './types';
import { analyzeCompetitorPricingMatrix } from './competitor-pricing';
import { analyzeCompetitorVelocity } from './competitor-velocity';
import { analyzePlatformAttribution } from './platform-attribution';
import { analyzeReviewTopics } from './review-topics';
import { calculateSummary } from './summary';
import { evaluateSentimentAlerts } from './sentiment-alerts';
import { forecastSentimentTrend } from './sentiment-trend';
import { generateAutoReply } from './auto-reply';
import { generateCompetitorActionPlan } from './competitor-action-plan';
import { optimizeReviewRequestTiming } from './review-timing';
import { predictClientChurnRisk } from './client-churn';
import { classifySentiment } from './sentiment';

export class ReputationEngine {
  public calculateSummary(request: ReputationSummaryRequest): ReputationSummaryResult {
    return calculateSummary(request);
  }

  public classifySentiment(rating: number, comment: string): SentimentType {
    return classifySentiment(rating, comment);
  }

  public generateAutoReply(request: AutoReplyRequest): AutoReplyResult {
    return generateAutoReply(request);
  }

  public analyzeCompetitorVelocity(
    request: CompetitorVelocityAnalysisRequest
  ): CompetitorVelocityAnalysisResult {
    return analyzeCompetitorVelocity(request);
  }

  public analyzeReviewTopics(reviews: ReviewInput[]): TopicSentimentAnalysisResult {
    return analyzeReviewTopics(reviews);
  }

  public generateCompetitorActionPlan(
    request: CompetitorActionPlanRequest
  ): CompetitorActionPlanResult {
    return generateCompetitorActionPlan(request);
  }

  public evaluateSentimentAlerts(
    reviews: ReviewInput[],
    rules: SentimentAlertRule[]
  ): SentimentAlertEvaluationResult {
    return evaluateSentimentAlerts(reviews, rules);
  }

  public analyzeCompetitorPricingMatrix(
    request: CompetitorPricingMatrixRequest
  ): CompetitorPricingMatrixResult {
    return analyzeCompetitorPricingMatrix(request);
  }

  public forecastSentimentTrend(
    request: ReviewSentimentTrendForecastRequest
  ): ReviewSentimentTrendForecastResult {
    return forecastSentimentTrend(request);
  }

  public analyzePlatformAttribution(reviews: ReviewInput[]): PlatformAttributionAnalysisResult {
    return analyzePlatformAttribution(reviews);
  }

  public optimizeReviewRequestTiming(
    request: ReviewRequestTimingOptimizationRequest
  ): ReviewRequestTimingOptimizationResult {
    return optimizeReviewRequestTiming(request);
  }

  public predictClientChurnRisk(
    request: ClientChurnRiskPredictionRequest
  ): ClientChurnRiskPredictionResult {
    return predictClientChurnRisk(request);
  }
}
