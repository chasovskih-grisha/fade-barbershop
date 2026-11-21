import type { ReviewTopicCategory } from './types';

export const REVIEW_TOPICS: ReviewTopicCategory[] = [
  'Haircut Precision',
  'Punctuality & Wait Time',
  'Shop Vibe & Cleanliness',
  'Staff Courtesy',
  'Beard & Grooming',
];

export const TOPIC_KEYWORDS: Record<ReviewTopicCategory, string[]> = {
  'Haircut Precision': ['fade', 'cut', 'shape', 'symmetry', 'precision', 'masterclass'],
  'Punctuality & Wait Time': ['wait', 'late', 'time', 'delay', 'punctual', 'schedule'],
  'Shop Vibe & Cleanliness': ['clean', 'vibe', 'shop', 'atmosphere', 'towel', 'coffee'],
  'Staff Courtesy': ['staff', 'friendly', 'rude', 'courtesy', 'welcome', 'service'],
  'Beard & Grooming': ['beard', 'trim', 'sculpting', 'mustache', 'shave'],
};
