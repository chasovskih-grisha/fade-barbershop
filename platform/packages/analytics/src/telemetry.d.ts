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
export declare class Logger {
    private static defaultContext;
    static setDefaultContext(context: LogContext): void;
    private static format;
    static debug(message: string, context?: LogContext): void;
    static info(message: string, context?: LogContext): void;
    static warn(message: string, context?: LogContext, error?: any): void;
    static error(message: string, context?: LogContext, error?: any): void;
    static fatal(message: string, context?: LogContext, error?: any): void;
}
export interface MetricMeasurement {
    name: string;
    value: number;
    unit?: string;
    tags?: Record<string, string>;
    timestamp: number;
}
export declare class TelemetryCollector {
    private static instance;
    private metrics;
    private constructor();
    static getInstance(): TelemetryCollector;
    recordMetric(name: string, value: number, unit?: string, tags?: Record<string, string>): void;
    getMetrics(): MetricMeasurement[];
    flushMetrics(): MetricMeasurement[];
}
export declare const telemetry: TelemetryCollector;
