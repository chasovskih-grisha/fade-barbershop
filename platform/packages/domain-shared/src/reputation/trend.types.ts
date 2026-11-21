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
