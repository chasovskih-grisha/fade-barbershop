/**
 * FADE Attribution & Conversion Journey Intelligence Tracker
 * Tracks user touchpoints, traffic source attribution (First-Touch, Last-Touch, Linear, Time-Decay),
 * and multi-step user journey path history for optimization.
 */

import { buildTouchpoint, isRecentDuplicate } from './attribution-helpers';
import { weighTouchpoints } from './attribution-weights';

export interface Touchpoint {
  source: string;
  medium: string;
  campaign?: string;
  content?: string;
  term?: string;
  landingPage: string;
  timestamp: number;
}

export interface TouchpointParams {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  landingPage?: string;
}

export type AttributionModel = 'first_touch' | 'last_touch' | 'linear' | 'time_decay';

const TOUCHPOINT_STORAGE_KEY = 'fade_attribution_journey';
const MAX_STORED_TOUCHPOINTS = 10;

export function recordTouchpoint(params: TouchpointParams): Touchpoint[] {
  if (typeof window === 'undefined') return [];

  const newTouchpoint = buildTouchpoint(params);
  try {
    const existingRaw = localStorage.getItem(TOUCHPOINT_STORAGE_KEY);
    let touchpoints: Touchpoint[] = existingRaw ? JSON.parse(existingRaw) : [];
    if (!isRecentDuplicate(touchpoints, newTouchpoint)) {
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

export function calculateAttributionWeights(
  model: AttributionModel = 'last_touch'
): Record<string, number> {
  const touchpoints = getJourneyTouchpoints();
  return touchpoints.length === 0 ? { direct: 1.0 } : weighTouchpoints(touchpoints, model);
}

export const attributionAnalytics = {
  recordTouchpoint,
  getJourneyTouchpoints,
  calculateAttributionWeights,
};
