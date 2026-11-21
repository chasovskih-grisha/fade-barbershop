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
