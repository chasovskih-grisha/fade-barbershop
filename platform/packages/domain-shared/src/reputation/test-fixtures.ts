import type { CompetitorBenchmark, ReviewInput } from './types';

export const mockReviews: ReviewInput[] = [
  {
    id: 'rev-1',
    clientName: 'Alexander Wright',
    service: 'Executive Fade',
    barber: 'Dmytro K.',
    rating: 5,
    comment: 'Absolute masterclass! Dmytro understood exactly what shape I needed.',
    date: '2026-11-10',
    platform: 'Google',
    replied: true,
  },
  {
    id: 'rev-2',
    clientName: 'Viktor Hnativ',
    service: 'Beard Sculpting',
    barber: 'Oleg M.',
    rating: 2,
    comment: 'Trimmed too short on the left side. Disappointed with symmetry.',
    date: '2026-11-08',
    platform: 'App Feedback',
    replied: false,
  },
  {
    id: 'rev-3',
    clientName: 'Max Taylor',
    service: 'Classic Haircut',
    barber: 'Andriy S.',
    rating: 3,
    comment: 'It was okay, decent haircut.',
    date: '2026-11-09',
    platform: 'Yelp',
    replied: true,
  },
];

export const mockCompetitors: CompetitorBenchmark[] = [
  {
    competitorName: 'Gentlemen Club',
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
