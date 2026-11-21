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

export interface CompetitorBenchmark {
  competitorName: string;
  rating: number;
  reviewCount: number;
  responseRatePct: number;
  avgReplyHours: number;
}

export interface ReputationSummaryRequest {
  reviews: ReviewInput[];
  competitorBenchmarks?: CompetitorBenchmark[];
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
