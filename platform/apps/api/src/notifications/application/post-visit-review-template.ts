import { renderEmailTemplate } from '../infrastructure/liquid-email-renderer';
import { httpUrl } from './letter-fields';

export interface PostVisitReviewData {
  clientName?: string;
  serviceName?: string;
  barberName?: string;
  feedbackUrl?: string;
  googleReviewUrl?: string;
  brand?: string;
}

function view(data: PostVisitReviewData, brand: string): Record<string, unknown> {
  return {
    brand,
    clientName: data.clientName ?? '',
    serviceName: data.serviceName ?? '',
    barberName: data.barberName ?? '',
    feedbackUrl: httpUrl(data.feedbackUrl),
    googleReviewUrl: httpUrl(data.googleReviewUrl),
  };
}

export function renderReviewSubject(data: PostVisitReviewData, brand = 'FADE'): string {
  return renderEmailTemplate('post-visit-review', 'subject', view(data, brand));
}

export function renderReviewText(data: PostVisitReviewData, brand = 'FADE'): string {
  return renderEmailTemplate('post-visit-review', 'text', view(data, brand));
}

export function renderReviewHtml(data: PostVisitReviewData, brand = 'FADE'): string {
  return renderEmailTemplate('post-visit-review', 'html', view(data, brand));
}
