import { Module } from '@nestjs/common';
import { DiagnosticsController } from './diagnostics.controller';
import { MetricsModule } from '../metrics/metrics.module';
import { ErrorTrackerService } from '../logging/error-tracker.service';

@Module({
  imports: [MetricsModule],
  providers: [ErrorTrackerService],
  controllers: [DiagnosticsController],
  exports: [ErrorTrackerService],
})
export class DiagnosticsModule {}
