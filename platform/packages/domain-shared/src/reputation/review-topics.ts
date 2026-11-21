import type {
  ReviewInput,
  ReviewTopicCategory,
  SentimentType,
  TopicSentimentAnalysisResult,
  TopicSentimentSummary,
} from './types';
import { REVIEW_TOPICS, TOPIC_KEYWORDS } from './topic-config';

function matchingReviews(reviews: ReviewInput[], topic: ReviewTopicCategory): ReviewInput[] {
  const keywords = TOPIC_KEYWORDS[topic];
  return reviews.filter((review) => {
    const text = `${review.comment} ${review.service}`.toLowerCase();
    return keywords.some((keyword) => text.includes(keyword));
  });
}

function buildSummary(reviews: ReviewInput[], topic: ReviewTopicCategory): TopicSentimentSummary {
  const matches = matchingReviews(reviews, topic);
  if (matches.length === 0) {
    return {
      topic,
      mentionCount: 0,
      averageRating: 5.0,
      sentimentScore: 100,
      dominantSentiment: 'positive',
      keyDrivers: ['No recent mentions'],
    };
  }

  const totalRating = matches.reduce((sum, review) => sum + review.rating, 0);
  const avgRating = Number((totalRating / matches.length).toFixed(1));
  const dominantSentiment: SentimentType =
    avgRating >= 4 ? 'positive' : avgRating <= 2 ? 'negative' : 'neutral';

  return {
    topic,
    mentionCount: matches.length,
    averageRating: avgRating,
    sentimentScore: Math.round((avgRating / 5) * 100),
    dominantSentiment,
    keyDrivers: TOPIC_KEYWORDS[topic].slice(0, 3),
  };
}

/**
 * Analyze review sentiment clustered by topic categories.
 */
export function analyzeReviewTopics(reviews: ReviewInput[]): TopicSentimentAnalysisResult {
  const topics = REVIEW_TOPICS.map((topic) => buildSummary(reviews, topic));
  const sortedBySentiment = [...topics].sort((a, b) => b.sentimentScore - a.sentimentScore);

  return {
    topics,
    topStrength: sortedBySentiment[0]?.topic || 'Haircut Precision',
    primaryImprovementArea:
      sortedBySentiment[sortedBySentiment.length - 1]?.topic || 'Punctuality & Wait Time',
  };
}
