// MetricsModule — GET /metrics (T-4204a). Імпортує HealthModule: GeocoderMetrics
// має бути ТОЙ САМИЙ інстанс, що лічить для /health (інакше /metrics показував
// би нулі, поки /health росте). OutboxHealthContributor HealthModule не
// експортує — провайдиться локально; токен HEALTH_IO тут не потрібен.
import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { HealthModule } from '../health/health.module';
import { OutboxHealthContributor } from '../health/outbox-health.contributor';
import { RumModule } from '../rum/rum.module';
import { HttpMetrics } from './http-metrics';

@Module({
  imports: [HealthModule, RumModule],
  controllers: [MetricsController],
  providers: [OutboxHealthContributor, HttpMetrics],
  exports: [HttpMetrics],
})
export class MetricsModule {}
