"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkHealth = checkHealth;
const telemetry_1 = require("./telemetry");
function checkHealth() {
    const memoryUsage = process.memoryUsage();
    const metricsCount = telemetry_1.telemetry.getMetrics().length;
    // Basic heuristic: if heap used is > 90% of heap total, mark degraded
    const heapUsageRatio = memoryUsage.heapUsed / memoryUsage.heapTotal;
    const status = heapUsageRatio > 0.9 ? 'degraded' : 'healthy';
    const health = {
        status,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memoryUsage,
        metricsCount,
    };
    if (status === 'healthy') {
        telemetry_1.Logger.info('Health check passed', { health });
    }
    else {
        telemetry_1.Logger.warn('Health check degraded due to high memory usage', { health });
    }
    return health;
}
