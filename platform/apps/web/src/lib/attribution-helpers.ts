import type { Touchpoint, TouchpointParams } from './attribution';

export function buildTouchpoint(params: TouchpointParams): Touchpoint {
  return {
    source: params.source || 'direct',
    medium: params.medium || (params.source ? 'referral' : 'none'),
    landingPage: params.landingPage || window.location.pathname,
    timestamp: Date.now(),
    ...(params.campaign !== undefined ? { campaign: params.campaign } : {}),
    ...(params.content !== undefined ? { content: params.content } : {}),
    ...(params.term !== undefined ? { term: params.term } : {}),
  };
}

/** Same source/medium within 30 minutes is the same journey step. */
export function isRecentDuplicate(touchpoints: Touchpoint[], candidate: Touchpoint): boolean {
  const last = touchpoints[touchpoints.length - 1];
  return Boolean(
    last &&
    last.source === candidate.source &&
    last.medium === candidate.medium &&
    candidate.timestamp - last.timestamp <= 30 * 60 * 1000
  );
}
