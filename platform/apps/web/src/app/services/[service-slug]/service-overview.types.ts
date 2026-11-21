import type { LoadableList } from '@/lib/api/loadable';

export const FIXED_DATE = '2026-10-02';

export type Barbers = LoadableList<{ id: string; name: string; slug: string }>;
export type Slots = LoadableList<{ start: string; end: string; barbers: string[] }>;

export interface ServiceFaq {
  question: string;
  answer: string;
}

export interface ServiceReview {
  author: string;
  datePublished: string;
  reviewRating: { ratingValue: string; bestRating: string };
  reviewBody: string;
}

export type BookingHref = (slot?: { start: string; end: string }) => string;
