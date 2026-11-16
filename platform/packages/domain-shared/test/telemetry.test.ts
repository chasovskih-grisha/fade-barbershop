import { Logger, MetricsCollector, ErrorBoundary } from '../src/telemetry/index';

describe('Telemetry & Error Boundary', () => {
  beforeEach(() => {
    MetricsCollector.reset();
  });

  test('Logger logs without throwing', () => {
    const logger = new Logger('TestService');
    expect(() => {
      logger.info('Test info message', { userId: '123' });
      logger.warn('Test warn message');
      logger.error('Test error message', new Error('Boom'), { code: 'ERR_TEST' });
    }).not.toThrow();
  });

  test('MetricsCollector tracks counters and histograms correctly', () => {
    MetricsCollector.incrementCounter('test.counter', 1, { status: 'ok' });
    MetricsCollector.incrementCounter('test.counter', 2, { status: 'ok' });
    MetricsCollector.recordHistogram('test.latency', 100);
    MetricsCollector.recordHistogram('test.latency', 200);

    const snapshot = MetricsCollector.getMetricsSnapshot();
    expect(snapshot.counters['test.counter:{"status":"ok"}']).toBe(3);
    expect(snapshot.histograms['test.latency:{}'].count).toBe(2);
    expect(snapshot.histograms['test.latency:{}'].avg).toBe(150);
  });

  test('ErrorBoundary wraps async functions successfully', async () => {
    const logger = new Logger('TestService');
    const result = await ErrorBoundary.wrapAsync(logger, 'async.op', async () => {
      return 'success';
    });
    expect(result).toBe('success');
    const snapshot = MetricsCollector.getMetricsSnapshot();
    expect(snapshot.counters['async.op.success:{}']).toBe(1);
  });

  test('ErrorBoundary handles async errors with fallback', async () => {
    const logger = new Logger('TestService');
    const result = await ErrorBoundary.wrapAsync(
      logger,
      'async.fail.op',
      async () => {
        throw new Error('Failed');
      },
      'fallback_value'
    );
    expect(result).toBe('fallback_value');
    const snapshot = MetricsCollector.getMetricsSnapshot();
    expect(snapshot.counters['async.fail.op.error:{}']).toBe(1);
  });
});
