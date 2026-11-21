import type { SentimentType } from './types';

const NEGATIVE_KEYWORDS = [
  'bad',
  'poor',
  'disappointed',
  'terrible',
  'worst',
  'horrible',
  'wrong',
  'short',
  'wait',
  'late',
];

const POSITIVE_KEYWORDS = [
  'great',
  'excellent',
  'amazing',
  'masterclass',
  'perfect',
  'clean',
  'top',
  'love',
  'best',
];

/**
 * Classify review sentiment based on rating and keyword analysis.
 */
export function classifySentiment(rating: number, comment: string): SentimentType {
  if (rating >= 4) return 'positive';
  if (rating <= 2) return 'negative';

  const lower = (comment || '').toLowerCase();
  const hasNeg = NEGATIVE_KEYWORDS.some((keyword) => lower.includes(keyword));
  const hasPos = POSITIVE_KEYWORDS.some((keyword) => lower.includes(keyword));

  if (hasNeg && !hasPos) return 'negative';
  if (hasPos && !hasNeg) return 'positive';

  return 'neutral';
}
