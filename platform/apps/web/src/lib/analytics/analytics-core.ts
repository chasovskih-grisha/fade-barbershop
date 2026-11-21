/**
 * FADE Analytics & Conversion Intelligence Wrapper (GA4 / GTM DataLayer & Amplitude bridge)
 * Adheres to T-4597 analytics taxonomy and privacy standards (no PII).
 */

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    amplitude?: {
      track?: (eventName: string, props?: Record<string, unknown>) => void;
      setUserId?: (userId: string | null) => void;
    };
  }
}

export type FunnelEventParams = {
  funnel_instance_id?: string;
  entry_point?: string;
  location_code?: string;
  service_id?: string;
  service_name?: string;
  price?: number;
  duration_minutes?: number;
  barber_id?: string;
  is_any_barber?: boolean;
  slot_start?: string;
  day_offset?: number;
  booking_id?: string;
  booking_value?: number;
  error_code?: string;
  failed_step?: string;
  provider?: string;
  [key: string]: unknown;
};

export type UtmParams = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  [key: string]: unknown;
};

let currentFunnelInstanceId: string | null = null;

function newFunnelInstanceId(): string {
  return 'fn_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
}

export function getOrCreateFunnelInstanceId(): string {
  if (!currentFunnelInstanceId) currentFunnelInstanceId = newFunnelInstanceId();
  return currentFunnelInstanceId;
}

export function resetFunnelInstanceId(): string {
  currentFunnelInstanceId = newFunnelInstanceId();
  return currentFunnelInstanceId;
}

export function getUtmParamsFromUrl(searchQuery?: string): UtmParams {
  if (typeof window === 'undefined' && !searchQuery) return {};
  const query = searchQuery || (typeof window !== 'undefined' ? window.location.search : '');
  const params = new URLSearchParams(query);
  const utm: UtmParams = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((key) => {
    const val = params.get(key);
    if (val) utm[key] = val;
  });
  return utm;
}

export function persistUtmParams(searchQuery?: string): UtmParams {
  if (typeof window === 'undefined') return {};
  const utm = getUtmParamsFromUrl(searchQuery);
  if (Object.keys(utm).length > 0) {
    try {
      localStorage.setItem('fade_utm_params', JSON.stringify(utm));
    } catch {
      // ignore storage errors
    }
  }
  return utm;
}

export function getStoredUtmParams(): UtmParams {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem('fade_utm_params');
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return getUtmParamsFromUrl();
}

export function trackEvent(eventName: string, params: FunnelEventParams = {}) {
  const enrichedParams = {
    ...params,
    funnel_instance_id: params.funnel_instance_id || currentFunnelInstanceId,
    timestamp: Date.now(),
  };
  if (typeof window !== 'undefined') {
    if (!window.dataLayer) window.dataLayer = [];
    window.dataLayer.push({ event: eventName, ...enrichedParams });
    if (window.amplitude?.track) window.amplitude.track(eventName, enrichedParams);
  }
}
