import { Logger, telemetry } from './telemetry';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  metricsCount: number;
}

export function checkHealth(): HealthStatus {
  const memoryUsage = process.memoryUsage();
  const metricsCount = telemetry.getMetrics().length;
  
  // Basic heuristic: if heap used is > 90% of heap total, mark degraded
  const heapUsageRatio = memoryUsage.heapUsed / memoryUsage.heapTotal;
  const status = heapUsageRatio > 0.9 ? 'degraded' : 'healthy';

  const health: HealthStatus = {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage,
    metricsCount,
  };

  if (status === 'healthy') {
    Logger.info('Health check passed', { health });
  } else {
    Logger.warn('Health check degraded due to high memory usage', { health });
  }

  return health;
}
