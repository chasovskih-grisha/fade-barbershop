// Специфікація http-секції exposition (SLO SLI, docs/slo.md): винесена з
// metrics-exposition.spec — гейт max-lines тримає файли спеків ≤100 рядків.
import { buildMetricsExposition } from './metrics-exposition';

const GEOCODER = {
  cache_hit: 3,
  cache_miss: 5,
  rate_limit_rejected: 1,
  tombstoned: 0,
  provider_failure: 2,
  provider_success: 7,
};

const BASE = {
  uptimeMs: 1000,
  nodeVersion: 'v20.11.0',
  rssMegabytes: '100.0',
  geocoder: GEOCODER,
  outbox: null,
  rateLimitViolations: null,
} as const;

describe('buildMetricsExposition — http SLI', () => {
  it('рядки route × код + booking slow; сортування стабільне', () => {
    const out = buildMetricsExposition({
      ...BASE,
      http: { routes: { booking: { '5xx': 2, '2xx': 7 }, identity: { '2xx': 1 } }, bookingSlow: 2 },
    });
    expect(out).toContain('# HELP fade_http_requests_total');
    expect(out).toContain('# TYPE fade_http_requests_total counter');
    expect(out).toContain('fade_http_requests_total{route="booking",code="2xx"} 7');
    expect(out).toContain('fade_http_requests_total{route="booking",code="5xx"} 2');
    expect(out).toContain('fade_http_requests_total{route="identity",code="2xx"} 1');
    expect(out).toContain('# TYPE fade_http_booking_slow_total counter');
    expect(out).toContain('fade_http_booking_slow_total 2');
    expect(out.endsWith('\n')).toBe(true);
  });

  it('null http — секції немає (мінімальна збірка)', () => {
    const out = buildMetricsExposition({ ...BASE, http: null });
    expect(out).not.toContain('fade_http');
  });
});
