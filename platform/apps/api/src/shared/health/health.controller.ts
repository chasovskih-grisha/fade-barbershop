// HealthController — GET /health: статус процесу, uptime, метрики геокодера
// і лаг outbox (T-042c). Повертає 200 завжди, поки процес живий:
// деградації залежностей видно в секціях (geocoder/outbox), а не як 503 —
// проба не має виглядати падінням, коли залежність чесно деградувала.
// Проба outbox резолвиться через ModuleRef { strict: false }: мінімальна
// збірка (без scheduling у графі) деградує секцію до null без імпорт-циклу.

import { Controller, Get, Inject } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import type { GeocoderHealthSection } from './geocoder-health.contributor';
import type { OutboxHealthSection } from './outbox-health.contributor';
import type { MemoryHealthSection } from './memory-health.contributor';
import type { DatabaseHealthSection } from './database-health.contributor';
import { OutboxLagProbe } from '../../scheduling/infrastructure/appointment-activity.projection';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorTrackerService } from '../logging/error-tracker.service';
import { HEALTH_IO, type HealthDeps } from './health.tokens';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(HEALTH_IO) private readonly deps: HealthDeps,
    private readonly moduleRef: ModuleRef
  ) {}

  @Get()
  async check(): Promise<{
    status: 'ok';
    uptimeMs: number;
    geocoder: GeocoderHealthSection;
    outbox: OutboxHealthSection | null;
    memory: MemoryHealthSection;
    database: DatabaseHealthSection;
    errors: ReturnType<ErrorTrackerService['snapshot']> | null;
  }> {
    const { metrics, stores, geocoderHealth, outboxHealth, memoryHealth, databaseHealth } = this.deps;
    // strict: false — шукаємо по всьому графу застосунку (проба живе в
    // SchedulingModule); у мінімальній збірці get() кидає → секція null.
    let probe: OutboxLagProbe | null = null;
    try {
      probe = this.moduleRef.get(OutboxLagProbe, { strict: false });
    } catch {
      probe = null;
    }

    let prismaService: PrismaService | null = null;
    try {
      prismaService = this.moduleRef.get(PrismaService, { strict: false });
    } catch {
      prismaService = null;
    }

    let errorTracker: ErrorTrackerService | null = null;
    try {
      errorTracker = this.moduleRef.get(ErrorTrackerService, { strict: false });
    } catch {
      errorTracker = null;
    }

    return {
      status: 'ok',
      uptimeMs: Math.round(process.uptime() * 1000),
      geocoder: await geocoderHealth.snapshot(metrics, stores),
      outbox: await outboxHealth.snapshot(probe ?? null),
      memory: memoryHealth.snapshot(),
      database: await databaseHealth.snapshot(prismaService),
      errors: errorTracker ? errorTracker.snapshot() : null,
    };
  }
}
