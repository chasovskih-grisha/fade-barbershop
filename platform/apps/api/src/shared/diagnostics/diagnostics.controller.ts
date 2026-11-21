import { Controller, Get, Optional, Inject } from '@nestjs/common';
import { HttpMetrics } from '../metrics/http-metrics';
import { ErrorTrackerService, type ErrorRecord } from '../logging/error-tracker.service';

@Controller('diagnostics')
export class DiagnosticsController {
  constructor(
    @Optional() @Inject(HttpMetrics) private readonly httpMetrics?: HttpMetrics,
    @Optional() private readonly errorTracker?: ErrorTrackerService
  ) {}

  @Get()
  check(): {
    status: 'ok';
    uptimeMs: number;
    memory: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
    nodeVersion: string;
    platform: string;
    env: {
      nodeEnv: string;
      serviceVersion: string;
      otelConfigured: boolean;
    };
    telemetry?: {
      routes: Record<string, Record<string, number>>;
      bookingSlow: number;
    };
    errorTracking?: {
      totalRecorded: number;
      recentErrors: ErrorRecord[];
    };
  } {
    const telemetry = this.httpMetrics?.snapshot();
    const errorTracking = this.errorTracker?.snapshot();
    return {
      status: 'ok',
      uptimeMs: Math.round(process.uptime() * 1000),
      memory: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      env: {
        nodeEnv: process.env.NODE_ENV ?? 'development',
        serviceVersion: process.env.npm_package_version ?? '0.0.0',
        otelConfigured: Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT),
      },
      ...(telemetry ? { telemetry } : {}),
      ...(errorTracking ? { errorTracking } : {}),
    };
  }
}
