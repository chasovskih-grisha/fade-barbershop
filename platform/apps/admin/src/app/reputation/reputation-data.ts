import type { CompetitorBenchmark, ReviewInput, SentimentAlertRule } from '@fade/domain-shared';

export const INITIAL_REVIEWS: ReviewInput[] = [
  {
    id: 'rev-1',
    clientName: 'Alexander Wright',
    service: 'Executive Fade & Beard Trim',
    barber: 'Dmytro K.',
    rating: 5,
    comment:
      'Absolute masterclass! Dmytro understood exactly what shape I needed. The hot towel finish was top notch.',
    date: '2026-11-10',
    platform: 'Google',
    replied: true,
  },
  {
    id: 'rev-2',
    clientName: 'Max Taylor',
    service: 'Classic Haircut',
    barber: 'Andriy S.',
    rating: 4,
    comment: 'Great haircut and clean shop. Waited about 10 minutes past my booking time though.',
    date: '2026-11-09',
    platform: 'Yelp',
    replied: false,
  },
  {
    id: 'rev-3',
    clientName: 'Viktor Hnativ',
    service: 'Beard Sculpting',
    barber: 'Oleg M.',
    rating: 2,
    comment:
      'Trimmed too short on the left side compared to the right. Disappointed with the symmetry.',
    date: '2026-11-08',
    platform: 'App Feedback',
    replied: false,
  },
];

export const INITIAL_BENCHMARKS: CompetitorBenchmark[] = [
  {
    competitorName: "Gentlemen's Club Barbershop",
    rating: 4.5,
    reviewCount: 120,
    responseRatePct: 45,
    avgReplyHours: 12,
  },
  {
    competitorName: 'Sharp & Co.',
    rating: 4.3,
    reviewCount: 95,
    responseRatePct: 30,
    avgReplyHours: 24,
  },
];

export const ALERT_RULES: SentimentAlertRule[] = [
  {
    id: 'a1',
    name: 'Critical Low Rating (<= 2)',
    triggerCondition: 'rating_lte_2',
    enabled: true,
    notificationChannel: 'Push',
  },
  {
    id: 'a2',
    name: 'Unreplied Negative Sentiment',
    triggerCondition: 'negative_sentiment',
    enabled: true,
    notificationChannel: 'Email',
  },
];
