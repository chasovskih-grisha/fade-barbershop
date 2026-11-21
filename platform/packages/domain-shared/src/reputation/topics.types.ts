import type { SentimentType } from './review.types';

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
