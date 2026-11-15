export interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    metricsCount: number;
}
export declare function checkHealth(): HealthStatus;
