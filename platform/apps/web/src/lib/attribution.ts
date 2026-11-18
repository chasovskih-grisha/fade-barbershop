/**
 * FADE Attribution & Conversion Journey Intelligence Tracker
 * Tracks user touchpoints, traffic source attribution (First-Touch, Last-Touch, Linear, Time-Decay),
 * and multi-step user journey path history for optimization.
 */

export interface Touchpoint {
  source: string;
  medium: string;
  campaign?: string;
  content?: string;
  term?: string;
  landingPage: string;
  timestamp: number;
}

export type AttributionModel = 'first_touch' | 'last_touch' | 'linear' | 'time_decay';

const TOUCHPOINT_STORAGE_KEY = 'fade_attribution_journey';
const MAX_STORED_TOUCHPOINTS = 10;

export function recordTouchpoint(params: {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  landingPage?: string;
}): Touchpoint[] {
  if (typeof window === 'undefined') return [];

  const source = params.source || 'direct';
  const medium = params.medium || (params.source ? 'referral' : 'none');
  const landingPage = params.landingPage || window.location.pathname;
  const timestamp = Date.now();

  const newTouchpoint: Touchpoint = {
    source,
    medium,
    landingPage,
    timestamp,
    ...(params.campaign !== undefined ? { campaign: params.campaign } : {}),
    ...(params.content !== undefined ? { content: params.content } : {}),
    ...(params.term !== undefined ? { term: params.term } : {}),
  };

  try {
    const existingRaw = localStorage.getItem(TOUCHPOINT_STORAGE_KEY);
    let touchpoints: Touchpoint[] = existingRaw ? JSON.parse(existingRaw) : [];

    // Avoid duplicate consecutive touchpoints from the same source/medium within 30 mins
    const last = touchpoints[touchpoints.length - 1];
    if (!last || last.source !== source || last.medium !== medium || timestamp - last.timestamp > 30 * 60 * 1000) {
      touchpoints.push(newTouchpoint);
      if (touchpoints.length > MAX_STORED_TOUCHPOINTS) {
        touchpoints = touchpoints.slice(-MAX_STORED_TOUCHPOINTS);
      }
      localStorage.setItem(TOUCHPOINT_STORAGE_KEY, JSON.stringify(touchpoints));
    }
    return touchpoints;
  } catch {
    return [newTouchpoint];
  }
}

export function getJourneyTouchpoints(): Touchpoint[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TOUCHPOINT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function calculateAttributionWeights(model: AttributionModel = 'last_touch'): Record<string, number> {
  const touchpoints = getJourneyTouchpoints();
  if (touchpoints.length === 0) return { direct: 1.0 };

  const weights: Record<string, number> = {};
  const total = touchpoints.length;

  if (model === 'first_touch') {
    const first = touchpoints[0];
    if (first) {
      const key = `${first.source}/${first.medium}`;
      weights[key] = 1.0;
    }
  } else if (model === 'last_touch') {
    const last = touchpoints[touchpoints.length - 1];
    if (last) {
      const key = `${last.source}/${last.medium}`;
      weights[key] = 1.0;
    }
  } else if (model === 'linear') {
    const share = 1.0 / total;
    touchpoints.forEach((tp) => {
      const key = `${tp.source}/${tp.medium}`;
      weights[key] = (weights[key] || 0) + share;
    });
  } else if (model === 'time_decay') {
    let totalWeight = 0;
    const decayWeights = touchpoints.map((tp, idx) => {
      // Half-life decay over touchpoints
      const w = Math.pow(2, idx / 2 - total / 2);
      totalWeight += w;
      return { tp, w };
    });
    decayWeights.forEach(({ tp, w }) => {
      const key = `${tp.source}/${tp.medium}`;
      weights[key] = (weights[key] || 0) + w / totalWeight;
    });
  }

  return weights;
}

export const attributionAnalytics = {
  recordTouchpoint,
  getJourneyTouchpoints,
  calculateAttributionWeights,
};
