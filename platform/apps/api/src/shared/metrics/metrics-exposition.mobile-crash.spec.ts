// Специфікація краш-секції exposition (T-4443): лічильники класу краху за
// версією і платформою; порожній/відсутній знімок секцію не емітить.
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

describe('buildMetricsExposition — mobile crash', () => {
  it('рядки клас × версія × платформа з HELP/TYPE', () => {
    const out = buildMetricsExposition({
      ...BASE,
      mobileCrash: { 'TypeError: x': { '1.2.0|ios': 3, '1.2.0|android': 1 } },
    });
    expect(out).toContain('# HELP fade_mobile_crashes_total');
    expect(out).toContain('# TYPE fade_mobile_crashes_total counter');
    expect(out).toContain(
      'fade_mobile_crashes_total{crash_class="TypeError: x",app_version="1.2.0",platform="ios"} 3'
    );
    expect(out).toContain(
      'fade_mobile_crashes_total{crash_class="TypeError: x",app_version="1.2.0",platform="android"} 1'
    );
  });

  it('відсутній знімок не емітить секцію', () => {
    const out = buildMetricsExposition({ ...BASE });
    expect(out).not.toContain('fade_mobile_crashes_total');
  });
});
