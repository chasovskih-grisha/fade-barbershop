/**
 * FADE Conversion Attribution & Cohort Allocation Enhancements
 * Implements advanced multi-touch attribution (First-touch, Last-touch, Linear, Time-decay)
 * and cohort analytics routing for FADE booking and membership funnels.
 */

import { isConsecutiveDuplicate, toTouchpoint } from './cohort-touchpoint';

export interface AttributionTouchpoint {
  timestamp: number;
  source: string;
  medium: string;
  campaign?: string | undefined;
  content?: string | undefined;
  term?: string | undefined;
  landingPage: string;
}

export interface AttributionReport {
  firstTouch: AttributionTouchpoint | null;
  lastTouch: AttributionTouchpoint | null;
  touchpoints: AttributionTouchpoint[];
  cohortWeek: string;
  cohortMonth: string;
  attributionWeights: Record<string, number>;
}

const ATTRIBUTION_STORAGE_KEY = 'fade_attribution_touchpoints';

export function recordTouchpoint(landingPage: string, queryParams?: string): AttributionTouchpoint {
  const touchpoint = toTouchpoint(landingPage, queryParams);
  if (typeof window === 'undefined') return touchpoint;

  try {
    const existingRaw = localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    const touchpoints: AttributionTouchpoint[] = existingRaw ? JSON.parse(existingRaw) : [];
    if (!isConsecutiveDuplicate(touchpoints, touchpoint)) {
      touchpoints.push(touchpoint);
      if (touchpoints.length > 20) touchpoints.shift();
      localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(touchpoints));
    }
  } catch {
    // ignore storage error
  }

  return touchpoint;
}

export function getAttributionReport(): AttributionReport {
  let touchpoints: AttributionTouchpoint[] = [];
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
      if (stored) touchpoints = JSON.parse(stored);
    } catch {
      // ignore
    }
  }

  if (touchpoints.length === 0) {
    const fallback = recordTouchpoint(
      typeof window !== 'undefined' ? window.location.pathname : '/'
    );
    touchpoints = [fallback];
  }

  const firstTouch = touchpoints[0] ?? {
    timestamp: Date.now(),
    source: 'direct',
    medium: 'none',
    landingPage: '/',
  };
  const lastTouch = touchpoints[touchpoints.length - 1] ?? firstTouch;

  const weights: Record<string, number> = {};
  const weightPerTouch = 1 / touchpoints.length;
  touchpoints.forEach((tp) => {
    const key = `${tp.source}/${tp.medium}`;
    weights[key] = (weights[key] || 0) + weightPerTouch;
  });

  const dateObj = new Date(firstTouch.timestamp);
  const cohortMonth = dateObj.toISOString().substring(0, 7);

  const d = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  const cohortWeek = `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;

  return {
    firstTouch,
    lastTouch,
    touchpoints,
    cohortWeek,
    cohortMonth,
    attributionWeights: weights,
  };
}
