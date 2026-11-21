import { getStoredUtmParams, getUtmParamsFromUrl, type UtmParams } from '../analytics';
import type { AttributionTouchpoint } from './cohort-attribution';

/** Builds a touchpoint from either explicit query params or the stored UTM snapshot. */
export function toTouchpoint(landingPage: string, queryParams?: string): AttributionTouchpoint {
  const utm: UtmParams = queryParams ? getUtmParamsFromUrl(queryParams) : getStoredUtmParams();
  return {
    timestamp: Date.now(),
    source: (utm.utm_source as string) || 'direct',
    medium: (utm.utm_medium as string) || 'none',
    campaign: (utm.utm_campaign as string) || undefined,
    content: (utm.utm_content as string) || undefined,
    term: (utm.utm_term as string) || undefined,
    landingPage,
  };
}

/** Consecutive identical source/medium within 30 minutes is the same visit. */
export function isConsecutiveDuplicate(
  touchpoints: AttributionTouchpoint[],
  candidate: AttributionTouchpoint
): boolean {
  const last = touchpoints[touchpoints.length - 1];
  return Boolean(
    last &&
    last.source === candidate.source &&
    last.medium === candidate.medium &&
    candidate.timestamp - last.timestamp < 30 * 60 * 1000
  );
}
