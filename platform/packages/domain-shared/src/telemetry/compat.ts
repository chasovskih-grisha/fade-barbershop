import { StructuredLogger, TelemetryCollector } from '../src/telemetry/index';

export class Logger {
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  public info(message: string, context?: Record<string, any>): void {
    StructuredLogger.info(message, { service: this.serviceName, ...context });
    TelemetryCollector.getInstance().recordEvent(`${this.serviceName}.info`, { message, ...context });
  }

  public warn(message: string, context?: Record<string, any>): void {
    StructuredLogger.warn(message, { service: this.serviceName, ...context });
    TelemetryCollector.getInstance().recordEvent(`${this.serviceName}.warn`, { message, ...context });
  }

  public error(message: string, error?: Error, context?: Record<string, any>): void {
    StructuredLogger.error(message, error, { service: this.serviceName, ...context });
    if (error) {
      TelemetryCollector.getInstance().recordError(`${this.serviceName}.error`, error, { message, ...context });
    } else {
      TelemetryCollector.getInstance().recordEvent(`${this.serviceName}.error`, { message, ...context });
    }
  }
}

export class MetricsCollector {
  private static counters: Map<string, number> = new Map();
  private static histograms: Map<string, number[]> = new Map();

  public static reset(): void {
    this.counters.clear();
    this.histograms.clear();
    TelemetryCollector.getInstance().clear();
  }

  public static incrementCounter(name: string, value: number = 1, attributes?: Record<string, any>): void {
    const key = `${name}:${JSON.stringify(attributes || {})}`;
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
    TelemetryCollector.getInstance().recordMetric(name, value);
  }

  public static recordHistogram(name: string, value: number, attributes?: Record<string, any>): void {
    const key = `${name}:${JSON.stringify(attributes || {})}`;
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);
    TelemetryCollector.getInstance().recordMetric(name, value);
  }

  public static getMetricsSnapshot(): { counters: Record<string, number>; histograms: Record<string, { count: number; avg: number; min: number; max: number }> } {
    const counters: Record<string, number> = {};
    for (const [k, v] of this.counters.entries()) {
      counters[k] = v;
    }

    const histograms: Record<string, { count: number; avg: number; min: number; max: number }> = {};
    for (const [k, values] of this.histograms.entries()) {
      if (values.length > 0) {
        const count = values.length;
        const sum = values.reduce((a, b) => a + b, 0);
        histograms[k] = {
          count,
          avg: sum / count,
          min: Math.min(...values),
          max: Math.max(...values),
        };
      }
    }

    return { counters, histograms };
  }
}

export class ErrorBoundary {
  public static async wrapAsync<T>(
    logger: Logger,
    operationName: string,
    fn: () => Promise<T>,
    fallback?: T
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      MetricsCollector.incrementCounter(`${operationName}.success`, 1);
      MetricsCollector.recordHistogram(`${operationName}.latency`, duration);
      logger.info(`Operation ${operationName} succeeded`, { durationMs: duration });
      return result;
    } catch (err: any) {
      const duration = Date.now() - start;
      MetricsCollector.incrementCounter(`${operationName}.error`, 1);
      logger.error(`Operation ${operationName} failed`, err, { durationMs: duration });
      if (fallback !== undefined) {
        return fallback;
      }
      throw err;
    }
  }

  public static wrap<T>(
    logger: Logger,
    operationName: string,
    fn: () => T,
    fallback?: T
  ): T {
    const start = Date.now();
    try {
      const result = fn();
      const duration = Date.now() - start;
      MetricsCollector.incrementCounter(`${operationName}.success`, 1);
      MetricsCollector.recordHistogram(`${operationName}.latency`, duration);
      logger.info(`Operation ${operationName} succeeded`, { durationMs: duration });
      return result;
    } catch (err: any) {
      const duration = Date.now() - start;
      MetricsCollector.incrementCounter(`${operationName}.error`, 1);
      logger.error(`Operation ${operationName} failed`, err, { durationMs: duration });
      if (fallback !== undefined) {
        return fallback;
      }
      throw err;
    }
  }
}
