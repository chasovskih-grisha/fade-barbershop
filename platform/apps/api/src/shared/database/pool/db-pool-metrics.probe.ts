// Проба пулу (T-4803): знімає pg_stat_activity і max_connections. Живе в
// shared, бо /metrics (MetricsModule) і health-секції обидва читають один
// інстанс через ModuleRef. Будь-який збій проби — null, щоб метрики не валили
// експозицію: недоступна БД уже видна в /health.
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { DbPoolSnapshot } from './pool-metrics';

interface ActivityRow {
  active: bigint | number;
  idle: bigint | number;
}

function toNumber(value: bigint | number | string | undefined): number {
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return value;
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Мапа «сирі рядки pg_stat_activity + max_connections» → снапшот. */
export function toPoolSnapshot(
  activity: ActivityRow | undefined,
  maxConnections: string | number | undefined
): DbPoolSnapshot {
  return {
    active: toNumber(activity?.active),
    idle: toNumber(activity?.idle),
    waiting: 0,
    maxConnections: toNumber(maxConnections),
  };
}

@Injectable()
export class DbPoolMetricsProbe {
  private readonly logger = new Logger('DbPoolMetrics');

  constructor(private readonly prisma: PrismaService) {}

  async snapshot(): Promise<DbPoolSnapshot | null> {
    try {
      const activity = await this.prisma.$queryRawUnsafe<ActivityRow[]>(
        "SELECT count(*) FILTER (WHERE state = 'active') AS active," +
          " count(*) FILTER (WHERE state = 'idle') AS idle FROM pg_stat_activity"
      );
      const settings =
        await this.prisma.$queryRawUnsafe<{ max_connections: string }[]>('SHOW max_connections');
      return toPoolSnapshot(activity[0], settings[0]?.max_connections);
    } catch (error) {
      this.logger.warn(error instanceof Error ? error.message : String(error));
      return null;
    }
  }
}
