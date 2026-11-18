// DbPoolModule (T-4803): проба пулу окремим модулем, щоб MetricsModule міг
// резолвити її через ModuleRef без жорсткої залежності на Prisma в графі
// метрик (мінімальні збірки без БД просто не мають секції пулу).
import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DbPoolMetricsProbe } from './db-pool-metrics.probe';

@Module({
  providers: [PrismaService, DbPoolMetricsProbe],
  exports: [DbPoolMetricsProbe],
})
export class DbPoolModule {}
