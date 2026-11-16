import { TelemetryCollector, StructuredLogger, withAsyncErrorHandling, HealthCheckManager } from '../src/telemetry/index';

describe('Telemetry & Error Boundary', () => {
  beforeEach(() => {
    TelemetryCollector.getInstance().clear();
  });

  test('StructuredLogger logs without throwing', () => {
    expect(() => {
      StructuredLogger.info('Test info message', { userId: '123' });
      StructuredLogger.warn('Test warn message');
      StructuredLogger.error('Test error message', new Error('Boom'), { code: 'ERR_TEST' });
    }).not.toThrow();
  });

  test('TelemetryCollector tracks events and metrics correctly', () => {
    TelemetryCollector.getInstance().recordEvent('test.event', { status: 'ok' }, 100);
    TelemetryCollector.getInstance().recordEvent('test.event', { status: 'ok' }, 200);
    TelemetryCollector.getInstance().recordMetric('test.latency', 100);
    TelemetryCollector.getInstance().recordMetric('test.latency', 200);

    const events = TelemetryCollector.getInstance().getEvents();
    expect(events.length).toBe(2);
    expect(events[0].name).toBe('test.event');

    const stats = TelemetryCollector.getInstance().getMetricStats('test.latency');
    expect(stats?.count).toBe(2);
    expect(stats?.avg).toBe(150);
  });

  test('withAsyncErrorHandling wraps async functions successfully', async () => {
    const result = await withAsyncErrorHandling('async.op', async () => {
      return 'success';
    });
    expect(result).toBe('success');
    const events = TelemetryCollector.getInstance().getEvents();
    expect(events.some(e => e.name === 'async.op.success')).toBe(true);
  });

  test('withAsyncErrorHandling handles async errors with fallback', async () => {
    const result = await withAsyncErrorHandling(
      'async.fail.op',
      async () => {
        throw new Error('Failed');
      },
      'fallback_value'
    );
    expect(result).toBe('fallback_value');
    const events = TelemetryCollector.getInstance().getEvents();
    expect(events.some(e => e.name === 'async.fail.op.error')).toBe(true);
  });
});
