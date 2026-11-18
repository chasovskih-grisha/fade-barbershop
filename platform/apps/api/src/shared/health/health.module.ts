// HealthModule — /health для контейнерних проб і спостережуваності
// (docs/observability.md): uptime + лічильники геокодера + режим сховищ
// геокодера + лаг outbox (T-042c; T-4204 підключить алерти). Модуль не
// залежить від бізнес-контекстів: проба outbox резолвиться через
// ModuleRef { strict: false } під час запиту — у мінімальній збірці
// (без scheduling) секція деградує до null без циклу імпортів.

import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HEALTH_IO } from './health.tokens';
import { GeocoderHealthContributor } from './geocoder-health.contributor';
import { OutboxHealthContributor } from './outbox-health.contributor';
import { MemoryHealthContributor } from './memory-health.contributor';
import { DatabaseHealthContributor } from './database-health.contributor';
import { GeocoderMetrics } from '../../locations/infrastructure/geocoder-metrics';
import { GeocoderStoresFactory } from '../../locations/infrastructure/geocoder-stores.factory';

// prettier-ignore
@Module({
  controllers: [HealthController],
  providers: [
    GeocoderMetrics,
    GeocoderStoresFactory,
    GeocoderHealthContributor,
    OutboxHealthContributor,
    MemoryHealthContributor,
    DatabaseHealthContributor,
    {
      provide: HEALTH_IO,
      useFactory: (...deps: any[]) => ({
        metrics: deps[0],
        stores: deps[1],
        geocoderHealth: deps[2],
        outboxHealth: deps[3],
        memoryHealth: deps[4],
        databaseHealth: deps[5],
      }),
      inject: [GeocoderMetrics, GeocoderStoresFactory, GeocoderHealthContributor, OutboxHealthContributor, MemoryHealthContributor, DatabaseHealthContributor],
    },
  ],
  exports: [GeocoderMetrics, GeocoderStoresFactory, MemoryHealthContributor, DatabaseHealthContributor],
})
export class HealthModule {}
