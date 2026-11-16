import { TelemetryCollector, StructuredLogger, withAsyncErrorHandling, globalHealth } from '../src/telemetry';

describe('Domain Shared Telemetry & Robustness', () => {
  it('should collect telemetry events and metrics properly', () => {
    const collector = TelemetryCollector.getInstance();
    collector.clear();
    collector.recordEvent('test.event', { foo: 'bar' }, 150);
    collector.recordMetric('test.metric', 42);

    expect(collector.getEvents().length).toBe(1);
    expect(collector.getEvents()[0].name).toBe('test.event');
    expect(collector.getMetricStats('test.metric')?.avg).toBe(42);
  });

  it('should handle async error handling wrapper with metrics', async () => {
    const res = await withAsyncErrorHandling('test.async', async () => {
      return 'success';
    });
    expect(res).toBe('success');

    await expect(withAsyncErrorHandling('test.async.fail', async () => {
      throw new Error('boom');
    })).rejects.toThrow('boom');
  });

  it('should run health checks successfully', () => {
    globalHealth.registerCheck('db', () => true);
    const health = globalHealth.runHealthCheck();
    expect(health.status).toBe('healthy');
    expect(health.checks['db'].status).toBe('pass');
  });
});
