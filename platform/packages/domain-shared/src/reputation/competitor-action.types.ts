import type { CompetitorBenchmark } from './review.types';

export interface CompetitorActionPlanRequest {
  fadeAverageRating: number;
  marketAverageRating: number;
  unrepliedNegativeCount: number;
  competitors: CompetitorBenchmark[];
}

export interface CompetitorActionPlanResult {
  strategicPriority: 'High' | 'Medium' | 'Low';
  actionItems: {
    category:
      'Review Acquisition' | 'Response Speed' | 'Quality & Operations' | 'Competitive Positioning';
    title: string;
    description: string;
    impact: 'High' | 'Medium' | 'Low';
  }[];
  summaryRecommendation: string;
}
