"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../src");
describe('Telemetry & Logging Specialist Package', () => {
    it('should format logs correctly', () => {
        const spy = jest.spyOn(console, 'info').mockImplementation(() => { });
        src_1.Logger.info('Test log message', { shopId: 'shop-123' });
        expect(spy).toHaveBeenCalled();
        const output = JSON.parse(spy.mock.calls[0][0]);
        expect(output.level).toBe('INFO');
        expect(output.message).toBe('Test log message');
        expect(output.context.shopId).toBe('shop-123');
        spy.mockRestore();
    });
    it('should collect and flush metrics', () => {
        const telemetry = src_1.TelemetryCollector.getInstance();
        telemetry.recordMetric('booking.latency', 150, 'ms', { service: 'haircut' });
        const metrics = telemetry.getMetrics();
        expect(metrics.length).toBeGreaterThan(0);
        expect(metrics[metrics.length - 1].name).toBe('booking.latency');
        expect(metrics[metrics.length - 1].value).toBe(150);
        const flushed = telemetry.flushMetrics();
        expect(flushed.length).toBeGreaterThan(0);
        expect(telemetry.getMetrics().length).toBe(0);
    });
    it('should return health status', () => {
        const health = (0, src_1.checkHealth)();
        expect(health.status).toBeDefined();
        expect(health.uptime).toBeGreaterThanOrEqual(0);
        expect(health.memoryUsage).toBeDefined();
    });
});
