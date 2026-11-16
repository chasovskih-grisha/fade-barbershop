export interface TelemetryEvent {
  name: string;
  timestamp: number;
  durationMs?: number;
  attributes?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

export class TelemetryCollector {
  private static instance: TelemetryCollector;
  private events: TelemetryEvent[] = [];
  private metrics: Map<string, number[]> = new Map();

  private constructor() {}

  public static getInstance(): TelemetryCollector {
    if (!TelemetryCollector.instance) {
      TelemetryCollector.instance = new TelemetryCollector();
    }
    return TelemetryCollector.instance;
  }

  public recordEvent(name: string, attributes?: Record<string, any>, durationMs?: number): void {
    const event: TelemetryEvent = {
      name,
      timestamp: Date.now(),
      durationMs,
      attributes,
    };
    this.events.push(event);
  }

  public recordError(name: string, error: Error, attributes?: Record<string, any>): void {
    const event: TelemetryEvent = {
      name,
      timestamp: Date.now(),
      attributes,
      error: {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      },
    };
    this.events.push(event);
  }

  public recordMetric(metricName: string, value: number): void {
    const values = this.metrics.get(metricName) || [];
    values.push(value);
    this.metrics.set(metricName, values);
  }

  public getEvents(): TelemetryEvent[] {
    return [...this.events];
  }

  public getMetricStats(metricName: string): { count: number; avg: number; min: number; max: number } | null {
    const values = this.metrics.get(metricName);
    if (!values || values.length === 0) return null;
    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    return { count, avg: sum / count, min, max };
  }

  public clear(): void {
    this.events = [];
    this.metrics.clear();
  }
}

export class StructuredLogger {
  public static info(message: string, context?: Record<string, any>): void {
    const logEntry = {
      level: 'INFO',
      timestamp: new Date().toISOString(),
      message,
      ...context,
    };
    console.log(JSON.stringify(logEntry));
  }

  public static error(message: string, error?: Error, context?: Record<string, any>): void {
    const logEntry = {
      level: 'ERROR',
      timestamp: new Date().toISOString(),
      message,
      error: error ? { message: error.message, stack: error.stack } : undefined,
      ...context,
    };
    console.error(JSON.stringify(logEntry));
  }

  public static warn(message: string, context?: Record<string, any>): void {
    const logEntry = {
      level: 'WARN',
      timestamp: new Date().toISOString(),
      message,
      ...context,
    };
    console.warn(JSON.stringify(logEntry));
  }
}

export function withErrorHandling<T>(operationName: string, fn: () => T, fallback?: T): T {
  const start = Date.now();
  try {
    const result = fn();
    const duration = Date.now() - start;
    TelemetryCollector.getInstance().recordEvent(`${operationName}.success`, {}, duration);
    StructuredLogger.info(`Operation ${operationName} succeeded`, { durationMs: duration });
    return result;
  } catch (err: any) {
    const duration = Date.now() - start;
    TelemetryCollector.getInstance().recordError(`${operationName}.error`, err, { durationMs: duration });
    StructuredLogger.error(`Operation ${operationName} failed`, err, { durationMs: duration });
    if (fallback !== undefined) {
      return fallback;
    }
    throw err;
  }
}

export async function withAsyncErrorHandling<T>(operationName: string, fn: () => Promise<T>, fallback?: T): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    TelemetryCollector.getInstance().recordEvent(`${operationName}.success`, {}, duration);
    StructuredLogger.info(`Async Operation ${operationName} succeeded`, { durationMs: duration });
    return result;
  } catch (err: any) {
    const duration = Date.now() - start;
    TelemetryCollector.getInstance().recordError(`${operationName}.error`, err, { durationMs: duration });
    StructuredLogger.error(`Async Operation ${operationName} failed`, err, { durationMs: duration });
    if (fallback !== undefined) {
      return fallback;
    }
    throw err;
  }
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptimeSeconds: number;
  checks: Record<string, { status: 'pass' | 'fail'; message?: string }>;
}

export class HealthCheckManager {
  private startTime: number = Date.now();
  private customChecks: Map<string, () => boolean> = new Map();

  public registerCheck(name: string, checkFn: () => boolean): void {
    this.customChecks.set(name, checkFn);
  }

  public runHealthCheck(): HealthCheckResult {
    const checks: Record<string, { status: 'pass' | 'fail'; message?: string }> = {};
    let allPassed = true;

    for (const [name, fn] of this.customChecks.entries()) {
      try {
        const passed = fn();
        checks[name] = { status: passed ? 'pass' : 'fail' };
        if (!passed) allPassed = false;
      } catch (err: any) {
        checks[name] = { status: 'fail', message: err.message };
        allPassed = false;
      }
    }

    // Default system check
    checks['system_memory'] = { status: 'pass' };

    return {
      status: allPassed ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      checks,
    };
  }
}

export const globalHealth = new HealthCheckManager();
