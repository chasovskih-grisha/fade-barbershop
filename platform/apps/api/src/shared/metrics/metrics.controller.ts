// MetricsController — GET /metrics у форматі Prometheus (T-4204a):
// процесні метрики + лічильники геокодера + лаг outbox. Джерело — ті самі
// провайдери, що й у /health (GeocoderMetrics з HealthModule, спільний
// інстанс). Проба outbox резолвиться через ModuleRef { strict: false }:
// у мінімальній збірці outbox-секція взагалі відсутня в експозиції.
import { Controller, Get, Header, type Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { GeocoderMetrics } from '../../locations/infrastructure/geocoder-metrics';
import { OutboxHealthContributor } from '../health/outbox-health.contributor';
import { MemoryHealthContributor } from '../health/memory-health.contributor';
import { OutboxLagProbe } from '../../scheduling/infrastructure/appointment-activity.projection';
import { RateLimitMetrics } from '../rate-limit/rate-limit.metrics';
import { WebVitalsMetrics } from '../rum/web-vitals-metrics';
import { MobileCrashMetrics } from '../rum/mobile-crash-metrics';
import { HttpMetrics } from './http-metrics';
import { DbPoolMetricsProbe } from '../database/pool/db-pool-metrics.probe';
import { buildMetricsExposition } from './metrics-exposition';

@Controller('metrics')
export class MetricsController {
  constructor(
    private readonly metrics: GeocoderMetrics,
    private readonly outboxHealth: OutboxHealthContributor,
    private readonly moduleRef: ModuleRef
  ) {}

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async get(): Promise<string> {
    const probe = this.optional(OutboxLagProbe);
    // RateLimitMetrics присутній лише коли IdentityModule у графі.
    const violations = this.optional(RateLimitMetrics);
    // SLI-лічильники (SLO, docs/slo.md): присутні, коли MetricsModule у графі.
    const http = this.optional(HttpMetrics);
    // RUM-лічильники (T-4204): той самий інстанс, що приймає маяки (RumModule).
    const webVitals = this.optional(WebVitalsMetrics);
    // Краш-звіти застосунку (T-4443): той самий інстанс, що приймає маяки.
    const mobileCrash = this.optional(MobileCrashMetrics);
    const poolProbe = this.optional(DbPoolMetricsProbe);
    const dbPool = poolProbe ? await poolProbe.snapshot() : null;
    const outbox = await this.outboxHealth.snapshot(probe);
    const memoryHealth = this.optional(MemoryHealthContributor);
    const memory = memoryHealth ? memoryHealth.snapshot() : null;
    return buildMetricsExposition({
      uptimeMs: Math.round(process.uptime() * 1000),
      nodeVersion: process.version,
      rssMegabytes: (process.memoryUsage().rss / 1048576).toFixed(1),
      geocoder: this.metrics.snapshot(),
      outbox: outbox && { pending: outbox.pending, oldestPendingMs: outbox.oldestPendingMs },
      rateLimitViolations: violations ? violations.total : null,
      http: http ? http.snapshot() : null,
      webVitals: webVitals ? webVitals.snapshot() : null,
      mobileCrash: mobileCrash ? mobileCrash.snapshot() : null,
      memory,
      dbPool,
    });
  }

  /** Провайдер із графа або null, якщо секції немає (мінімальна збірка). */
  private optional<T>(token: Type<T>): T | null {
    try {
      return this.moduleRef.get(token, { strict: false });
    } catch {
      return null;
    }
  }
}
