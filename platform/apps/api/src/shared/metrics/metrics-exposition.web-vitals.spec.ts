// Специфікація RUM-секції exposition (T-4204): лічильники Web Vitals за
// парою metric × rating; порожній/відсутній знімок секцію не емітить.
import { buildMetricsExposition } from './metrics-exposition';

const BASE = {
  uptimeMs: 1000,
  nodeVersion: 'v20.11.0',
  rssMegabytes: '100.0',
  geocoder: {
    cache_hit: 0,
    cache_miss: 0,
    rate_limit_rejected: 0,
    tombstoned: 0,
    provider_failure: 0,
    provider_success: 0,
  },
  outbox: null,
  rateLimitViolations: null,
  http: null,
} as const;

describe('buildMetricsExposition — web vitals', () => {
  it('рядки metric × rating з HELP/TYPE', () => {
    const out = buildMetricsExposition({
      ...BASE,
      webVitals: { lcp: { good: 7, poor: 2 }, cls: { 'needs-improvement': 1 } },
    });
    expect(out).toContain('# HELP fade_web_vitals_samples_total');
    expect(out).toContain('# TYPE fade_web_vitals_samples_total counter');
    expect(out).toContain('fade_web_vitals_samples_total{metric="lcp",rating="good"} 7');
    expect(out).toContain('fade_web_vitals_samples_total{metric="lcp",rating="poor"} 2');
    expect(out).toContain(
      'fade_web_vitals_samples_total{metric="cls",rating="needs-improvement"} 1'
    );
    expect(out.endsWith('\n')).toBe(true);
  });

  it('порожній знімок — заголовки є, серій немає', () => {
    const out = buildMetricsExposition({ ...BASE, webVitals: {} });
    expect(out).toContain('# TYPE fade_web_vitals_samples_total counter');
    expect(out).not.toContain('fade_web_vitals_samples_total{');
  });

  it('відсутня секція (мінімальна збірка) — жодного рядка RUM', () => {
    const out = buildMetricsExposition(BASE);
    expect(out).not.toContain('fade_web_vitals');
  });
});
