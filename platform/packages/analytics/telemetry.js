"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.telemetry = exports.TelemetryCollector = exports.Logger = void 0;
class Logger {
    static defaultContext = {};
    static setDefaultContext(context) {
        Logger.defaultContext = { ...Logger.defaultContext, ...context };
    }
    static format(level, message, context, error) {
        const entry = {
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
    static debug(message, context) {
        console.debug(Logger.format('DEBUG', message, context));
    }
    static info(message, context) {
        console.info(Logger.format('INFO', message, context));
    }
    static warn(message, context, error) {
        console.warn(Logger.format('WARN', message, context, error));
    }
    static error(message, context, error) {
        console.error(Logger.format('ERROR', message, context, error));
    }
    static fatal(message, context, error) {
        console.error(Logger.format('FATAL', message, context, error));
    }
}
exports.Logger = Logger;
class TelemetryCollector {
    static instance;
    metrics = [];
    constructor() { }
    static getInstance() {
        if (!TelemetryCollector.instance) {
            TelemetryCollector.instance = new TelemetryCollector();
        }
        return TelemetryCollector.instance;
    }
    recordMetric(name, value, unit, tags) {
        const measurement = {
            name,
            value,
            unit,
            tags,
            timestamp: Date.now(),
        };
        this.metrics.push(measurement);
        Logger.info(`[Telemetry] Metric recorded: ${name}=${value}${unit || ''}`, { tags });
    }
    getMetrics() {
        return [...this.metrics];
    }
    flushMetrics() {
        const flushed = [...this.metrics];
        this.metrics = [];
        return flushed;
    }
}
exports.TelemetryCollector = TelemetryCollector;
exports.telemetry = TelemetryCollector.getInstance();
