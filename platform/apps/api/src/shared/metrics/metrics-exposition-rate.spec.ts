import { buildMetricsExposition } from './metrics-exposition';
import { GEOCODER } from './metrics-exposition.fakes';

describe('buildMetricsExposition rate limits and empty outbox', () => {
  it('outbox with zero pending omits the oldest-age gauge (no samples)', () => {
    const out = buildMetricsExposition({
      uptimeMs: 1000,
      nodeVersion: 'v20.11.0',
      rssMegabytes: '100.0',
      geocoder: GEOCODER,
      outbox: { pending: 0, oldestPendingMs: null },
      rateLimitViolations: null,
      http: null,
    });
    expect(out).toContain('fade_outbox_pending_messages 0');
    expect(out).not.toContain('fade_outbox_oldest_pending_seconds');
  });

  it('rate limit violations: counter present when identity in graph, absent otherwise', () => {
    const withViolations = buildMetricsExposition({
      uptimeMs: 1000,
      nodeVersion: 'v20.11.0',
      rssMegabytes: '100.0',
      geocoder: GEOCODER,
      outbox: null,
      rateLimitViolations: 3,
      http: null,
    });
    expect(withViolations).toContain('# TYPE fade_rate_limit_violations_total counter');
    expect(withViolations).toContain('fade_rate_limit_violations_total 3');

    const without = buildMetricsExposition({
      uptimeMs: 1000,
      nodeVersion: 'v20.11.0',
      rssMegabytes: '100.0',
      geocoder: GEOCODER,
      outbox: null,
      rateLimitViolations: null,
      http: null,
    });
    expect(without).not.toContain('fade_rate_limit');
  });
});
