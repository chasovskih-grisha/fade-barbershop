// RumModule — прийом RUM-семплів (T-4204) і краш-звітів застосунку (T-4443).
// Метрики експортуються, щоб MetricsModule віддавав ті самі лічильники у
// /metrics (один інстанс).
import { Module } from '@nestjs/common';
import { WebVitalsController } from './web-vitals.controller';
import { WebVitalsMetrics } from './web-vitals-metrics';
import { MobileCrashController } from './mobile-crash.controller';
import { MobileCrashMetrics } from './mobile-crash-metrics';

@Module({
  controllers: [WebVitalsController, MobileCrashController],
  providers: [WebVitalsMetrics, MobileCrashMetrics],
  exports: [WebVitalsMetrics, MobileCrashMetrics],
})
export class RumModule {}
