export interface LogMetadata {
  correlationId?: string;
  userId?: string;
  service?: string;
  [key: string]: any;
}

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

export class Logger {
  private service: string;

  constructor(service: string) {
    this.service = service;
  }

  private formatMessage(level: LogLevel, message: string, metadata?: LogMetadata): string {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      message,
      ...metadata,
    };
    return JSON.stringify(entry);
  }

  public debug(message: string, metadata?: LogMetadata): void {
    console.debug(this.formatMessage(LogLevel.DEBUG, message, metadata));
  }

  public info(message: string, metadata?: LogMetadata): void {
    console.info(this.formatMessage(LogLevel.INFO, message, metadata));
  }

  public warn(message: string, metadata?: LogMetadata): void {
    console.warn(this.formatMessage(LogLevel.WARN, message, metadata));
  }

  public error(message: string, error?: Error | any, metadata?: LogMetadata): void {
    const errMeta = error instanceof Error ? {
      errorMessage: error.message,
      errorStack: error.stack,
      errorName: error.name,
    } : { error };
    console.error(this.formatMessage(LogLevel.ERROR, message, { ...errMeta, ...metadata }));
  }

  public fatal(message: string, error?: Error | any, metadata?: LogMetadata): void {
    const errMeta = error instanceof Error ? {
      errorMessage: error.message,
      errorStack: error.stack,
      errorName: error.name,
    } : { error };
    console.error(this.formatMessage(LogLevel.FATAL, message, { ...errMeta, ...metadata }));
  }
}

export class MetricsCollector {
  private static counters: Map<string, number> = new Map();
  private static histograms: Map<string, number[]> = new Map();

  public static incrementCounter(name: string, value: number = 1, labels?: Record<string, string>): void {
    const key = `${name}:${JSON.stringify(labels || {})}`;
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
  }

  public static recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const key = `${name}:${JSON.stringify(labels || {})}`;
    const values = this.histograms.get(key) || [];
    values.push(value);
    if (values.length > 1000) values.shift();
    this.histograms.set(key, values);
  }

  public static getMetricsSnapshot(): { counters: Record<string, number>, histograms: Record<string, { count: number, avg: number, p95: number }> } {
    const countersObj: Record<string, number> = {};
    for (const [k, v] of this.counters.entries()) {
      countersObj[k] = v;
    }

    const histogramsObj: Record<string, { count: number, avg: number, p95: number }> = {};
    for (const [k, v] of this.histograms.entries()) {
      const count = v.length;
      if (count === 0) {
        histogramsObj[k] = { count: 0, avg: 0, p95: 0 };
        continue;
      }
      const sum = v.reduce((acc, val) => acc + val, 0);
      const avg = sum / count;
      const sorted = [...v].sort((a, b) => a - b);
      const p95Index = Math.floor(sorted.length * 0.95);
      const p95 = sorted[p95Index] || sorted[sorted.length - 1];
      histogramsObj[k] = { count, avg, p95 };
    }

    return { counters: countersObj, histograms: histogramsObj };
  }

  public static reset(): void {
    this.counters.clear();
    this.histograms.clear();
  }
}

export class ErrorBoundary {
  public static async wrapAsync<T>(
    logger: Logger,
    operationName: string,
    fn: () => Promise<T>,
    fallback?: T
  ): Promise<T | undefined> {
    const startTime = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      MetricsCollector.incrementCounter(`${operationName}.success`);
      MetricsCollector.recordHistogram(`${operationName}.duration_ms`, duration);
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      MetricsCollector.incrementCounter(`${operationName}.error`);
      MetricsCollector.recordHistogram(`${operationName}.duration_ms`, duration);
      logger.error(`Error in operation ${operationName}: ${error?.message || error}`, error, { operationName, duration });
      if (fallback !== undefined) {
        return fallback;
      }
      throw error;
    }
  }

  public static wrapSync<T>(
    logger: Logger,
    operationName: string,
    fn: () => T,
    fallback?: T
  ): T | undefined {
    const startTime = Date.now();
    try {
      const result = fn();
      const duration = Date.now() - startTime;
      MetricsCollector.incrementCounter(`${operationName}.success`);
      MetricsCollector.recordHistogram(`${operationName}.duration_ms`, duration);
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      MetricsCollector.incrementCounter(`${operationName}.error`);
      MetricsCollector.recordHistogram(`${operationName}.duration_ms`, duration);
      logger.error(`Error in operation ${operationName}: ${error?.message || error}`, error, { operationName, duration });
      if (fallback !== undefined) {
        return fallback;
      }
      throw error;
    }
  }
}
