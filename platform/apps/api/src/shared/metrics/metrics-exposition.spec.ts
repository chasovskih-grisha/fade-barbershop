// Специфікація експозиції: HELP/TYPE для кожної метрики, uptime у секундах,
// версія Node як лейбл, лічильники геокодера з нулями на місці.
import { buildMetricsExposition } from './metrics-exposition';
import { GEOCODER } from './metrics-exposition.fakes';

describe('buildMetricsExposition', () => {
  it('process section: uptime, node version label, memory gauge', () => {
    const out = buildMetricsExposition({
      uptimeMs: 91230,
      nodeVersion: 'v20.11.0',
      rssMegabytes: '123.4',
      geocoder: GEOCODER,
      outbox: null,
      rateLimitViolations: null,
      http: null,
    });
    expect(out).toContain('# TYPE fade_uptime_seconds counter');
    expect(out).toContain('fade_uptime_seconds 91.23');
    expect(out).toContain('fade_nodejs_version_info{version="v20.11.0"} 1');
    expect(out).toContain('fade_process_resident_memory_megabytes 123.4');
  });

  it('geocoder counters: HELP/TYPE + values, zeros included', () => {
    const out = buildMetricsExposition({
      uptimeMs: 91230,
      nodeVersion: 'v20.11.0',
      rssMegabytes: '123.4',
      geocoder: GEOCODER,
      outbox: null,
      rateLimitViolations: null,
      http: null,
    });
    expect(out).toContain('# TYPE fade_geocoder_cache_hit counter');
    expect(out).toContain('fade_geocoder_cache_hit 3');
    expect(out).toContain('fade_geocoder_tombstoned 0');
    expect(out).toContain('fade_geocoder_provider_success 7');
    expect(out.endsWith('\n')).toBe(true);
  });

  it('outbox gauges: pending + oldest age; null probe omits the section', () => {
    const withOutbox = buildMetricsExposition({
      uptimeMs: 1000,
      nodeVersion: 'v20.11.0',
      rssMegabytes: '100.0',
      geocoder: GEOCODER,
      outbox: { pending: 3, oldestPendingMs: 1500 },
      rateLimitViolations: null,
      http: null,
    });
    expect(withOutbox).toContain('# TYPE fade_outbox_pending_messages gauge');
    expect(withOutbox).toContain('fade_outbox_pending_messages 3');
    expect(withOutbox).toContain('fade_outbox_oldest_pending_seconds 1.5');

    const withoutOutbox = buildMetricsExposition({
      uptimeMs: 1000,
      nodeVersion: 'v20.11.0',
      rssMegabytes: '100.0',
      geocoder: GEOCODER,
      outbox: null,
      rateLimitViolations: null,
      http: null,
    });
    expect(withoutOutbox).not.toContain('fade_outbox');
  });
});
