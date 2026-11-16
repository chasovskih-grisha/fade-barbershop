import { TelemetryCollector, StructuredLogger, withErrorHandling, withAsyncErrorHandling, HealthCheckManager } from '../src/telemetry';

describe('Booking Engine Telemetry & Diagnostics', () => {
  beforeEach(() => {
    TelemetryCollector.getInstance().clear();
  });

  test('records telemetry events and errors correctly', () => {
    const collector = TelemetryCollector.getInstance();
    collector.recordEvent('booking.attempt', { barberId: 'b1' }, 45);
    collector.recordError('booking.failed', new Error('Slot locked'), { slotKey: 'b1_10:00' });

    const events = collector.getEvents();
    expect(events.length).toBe(2);
    expect(events[0].name).toBe('booking.attempt');
    expect(events[0].durationMs).toBe(45);
    expect(events[1].error?.message).toBe('Slot locked');
  });

  test('calculates metric statistics correctly', () => {
    const collector = TelemetryCollector.getInstance();
    collector.recordMetric('latency', 100);
    collector.recordMetric('latency', 200);
    collector.recordMetric('latency', 300);

    const stats = collector.getMetricStats('latency');
    expect(stats).toEqual({ count: 3, avg: 200, min: 100, max: 300 });
  });

  test('withErrorHandling catches error and returns fallback', () => {
    const fallbackVal = 'fallback';
    const result = withErrorHandling('risky-op', () => {
      throw new Error('Boom');
    }, fallbackVal);

    expect(result).toBe(fallbackVal);
    const events = TelemetryCollector.getInstance().getEvents();
    expect(events.length).toBe(1);
    expect(events[0].name).toBe('risky-op.error');
  });

  test('health check manager returns correct status', () => {
    const health = new HealthCheckManager();
    health.registerCheck('database', () => true);
    health.registerCheck('cache', () => false);

    const report = health.runHealthCheck();
    expect(report.status).toBe('degraded');
    expect(report.checks['database'].status).toBe('pass');
    expect(report.checks['cache'].status).toBe('fail');
  });
});
