export interface LogContext {
  traceId?: string;
  userId?: string;
  shopId?: string;
  component?: string;
  [key: string]: any;
}

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export class Logger {
  private static defaultContext: LogContext = {};

  public static setDefaultContext(context: LogContext): void {
    Logger.defaultContext = { ...Logger.defaultContext, ...context };
  }

  private static format(level: LogLevel, message: string, context?: LogContext, error?: any): string {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...Logger.defaultContext, ...context },
    };

    if (error) {
      entry.error = {
        name: error.name || 'Error',
        message: error.message || String(error),
        stack: error.stack,
      };
    }

    return JSON.stringify(entry);
  }

  public static debug(message: string, context?: LogContext): void {
    console.debug(Logger.format('DEBUG', message, context));
  }

  public static info(message: string, context?: LogContext): void {
    console.info(Logger.format('INFO', message, context));
  }

  public static warn(message: string, context?: LogContext, error?: any): void {
    console.warn(Logger.format('WARN', message, context, error));
  }

  public static error(message: string, context?: LogContext, error?: any): void {
    console.error(Logger.format('ERROR', message, context, error));
  }

  public static fatal(message: string, context?: LogContext, error?: any): void {
    console.error(Logger.format('FATAL', message, context, error));
  }
}

export interface MetricMeasurement {
  name: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
  timestamp: number;
}

export class TelemetryCollector {
  private static instance: TelemetryCollector;
  private metrics: MetricMeasurement[] = [];

  private constructor() {}

  public static getInstance(): TelemetryCollector {
    if (!TelemetryCollector.instance) {
      TelemetryCollector.instance = new TelemetryCollector();
    }
    return TelemetryCollector.instance;
  }

  public recordMetric(name: string, value: number, unit?: string, tags?: Record<string, string>): void {
    const measurement: MetricMeasurement = {
      name,
      value,
      unit,
      tags,
      timestamp: Date.now(),
    };
    this.metrics.push(measurement);
    Logger.info(`[Telemetry] Metric recorded: ${name}=${value}${unit || ''}`, { tags });
  }

  public getMetrics(): MetricMeasurement[] {
    return [...this.metrics];
  }

  public flushMetrics(): MetricMeasurement[] {
    const flushed = [...this.metrics];
    this.metrics = [];
    return flushed;
  }
}

export const telemetry = TelemetryCollector.getInstance();
