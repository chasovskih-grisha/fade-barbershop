export type SentimentType = 'positive' | 'neutral' | 'negative';

export interface ReviewInput {
  id: string;
  clientName: string;
  service: string;
  barber: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
  platform: 'Google' | 'Yelp' | 'App Feedback' | 'Facebook' | 'Instagram';
  replied: boolean;
}

export interface ReputationSummaryRequest {
  reviews: ReviewInput[];
  competitorBenchmarks?: CompetitorBenchmark[];
}

export interface CompetitorBenchmark {
  competitorName: string;
  rating: number;
  reviewCount: number;
  responseRatePct: number;
  avgReplyHours: number;
}

export interface ReputationSummaryResult {
  totalReviews: number;
  averageRating: number;
  sentimentBreakdown: {
    positiveCount: number;
    neutralCount: number;
    negativeCount: number;
    positivePercentage: number;
  };
  responseMetrics: {
    repliedCount: number;
    pendingCount: number;
    responseRatePct: number;
  };
  escalationRequiredCount: number; // unreplied negative reviews (rating <= 2 or negative sentiment)
  competitiveComparison: {
    fadeRating: number;
    marketAverageRating: number;
    ratingDeltaVsMarket: number;
  };
}

export interface AutoReplyRequest {
  reviewId: string;
  clientName: string;
  rating: number;
  sentiment: SentimentType;
  service: string;
  barber: string;
}

export interface AutoReplyResult {
  reviewId: string;
  suggestedReply: string;
  requiresEscalationToAdmin: boolean;
  priority: 'low' | 'medium' | 'urgent';
}

export interface CompetitorVelocityInput {
  competitorName: string;
  monthlyReviews: number[];
  averageRating: number;
  sentimentScore: number;
}

export interface CompetitorVelocityAnalysisRequest {
  fadeMonthlyReviews: number[];
  fadeAverageRating: number;
  competitors: CompetitorVelocityInput[];
}

export interface CompetitorVelocityAnalysisResult {
  fadeReviewGrowthVelocity: number;
  fadeMarketShareOfVoice: number;
  marketLeader: string;
  threatLevel: 'low' | 'moderate' | 'high';
  competitiveRank: number;
  recommendations: string[];
}

export type ReviewTopicCategory =
  | 'Haircut Precision'
  | 'Punctuality & Wait Time'
  | 'Shop Vibe & Cleanliness'
  | 'Staff Courtesy'
  | 'Beard & Grooming';

export interface TopicSentimentSummary {
  topic: ReviewTopicCategory;
  mentionCount: number;
  averageRating: number;
  sentimentScore: number; // 0 to 100
  dominantSentiment: SentimentType;
  keyDrivers: string[];
}

export interface TopicSentimentAnalysisResult {
  topics: TopicSentimentSummary[];
  topStrength: ReviewTopicCategory;
  primaryImprovementArea: ReviewTopicCategory;
}

export interface CompetitorActionPlanRequest {
  fadeAverageRating: number;
  marketAverageRating: number;
  unrepliedNegativeCount: number;
  competitors: CompetitorBenchmark[];
}

export interface CompetitorActionPlanResult {
  strategicPriority: 'High' | 'Medium' | 'Low';
  actionItems: {
    category: 'Review Acquisition' | 'Response Speed' | 'Quality & Operations' | 'Competitive Positioning';
    title: string;
    description: string;
    impact: 'High' | 'Medium' | 'Low';
  }[];
  summaryRecommendation: string;
}

export interface SentimentAlertRule {
  id: string;
  name: string;
  triggerCondition: 'rating_lte_2' | 'negative_sentiment' | 'unreplied_duration_gt_24h' | 'competitor_rating_surge';
  enabled: boolean;
  notificationChannel: 'Push' | 'Email' | 'Webhook';
}

export interface SentimentAlertEvaluationResult {
  triggeredAlerts: {
    ruleId: string;
    ruleName: string;
    message: string;
    severity: 'info' | 'warning' | 'critical';
  }[];
  totalTriggered: number;
}

export interface CompetitorPricingInput {
  competitorName: string;
  averageHaircutPrice: number;
  rating: number;
  positioning: 'luxury' | 'mid-market' | 'budget';
}

export interface CompetitorPricingMatrixRequest {
  fadeAverageHaircutPrice: number;
  fadeAverageRating: number;
  competitors: CompetitorPricingInput[];
}

export interface CompetitorPricingMatrixResult {
  marketAveragePrice: number;
  priceDeltaVsMarket: number;
  positioningCategory: string;
  recommendation: string;
}

export interface ReviewSentimentTrendForecastRequest {
  monthlyAverageRatings: number[];
  monthlyReviewCounts: number[];
}

export interface ReviewSentimentTrendForecastResult {
  currentRating: number;
  projectedNextMonthRating: number;
  trajectory: 'improving' | 'stable' | 'declining';
  reviewMomentumIndex: number;
  brandLoyaltyScore: number;
  forecastingInsights: string[];
}

export interface PlatformAttributionSummary {
  platform: 'Google' | 'Yelp' | 'App Feedback' | 'Facebook' | 'Instagram';
  totalReviews: number;
  averageRating: number;
  positiveSentimentPct: number;
  responseRatePct: number;
  shareOfReviewsPct: number;
}

export interface PlatformAttributionAnalysisResult {
  platforms: PlatformAttributionSummary[];
  topPerformingPlatform: string;
  sourceDiversificationScore: number; // 0 to 100
  recommendations: string[];
}

export interface ReviewRequestTimingOptimizationRequest {
  clientName: string;
  service: string;
  barber: string;
  appointmentCompletionHour: number; // 0-23
  preferredChannel?: 'SMS' | 'Push' | 'Email';
  clientPastVisitsCount: number;
}

export interface ReviewRequestTimingOptimizationResult {
  optimalDelayMinutes: number;
  recommendedChannel: 'SMS' | 'Push' | 'Email';
  predictedConversionRatePct: number;
  predictedPositiveSentimentLikelihoodPct: number;
  rationale: string;
}

export interface ClientChurnRiskPredictionRequest {
  clientId: string;
  clientName: string;
  recentRating: number;
  recentComment: string;
  daysSinceLastVisit: number;
  totalVisitsCount: number;
  averageSpend: number;
}

export interface ClientChurnRiskPredictionResult {
  clientId: string;
  clientName: string;
  churnRiskScore: number; // 0 to 100
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  recommendedRetentionAction: string;
  voucherSuggested: boolean;
  voucherAmount: number;
}

