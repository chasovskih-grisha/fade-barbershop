// Лічильники показів/кліків блоку «рекомендуємо» (T-4445): добовий upsert,
// інкремент на місці — без read-modify-write гонки між воркерами.
import { Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { RecommendationEventKind } from '../domain/recommended-services';
import type { MetricRow, RecommendationMetricsPort } from '../application/recommended-ports';

@Injectable()
export class PrismaRecommendationMetricsRepository implements RecommendationMetricsPort {
  constructor(private readonly prisma: PrismaService) {}

  async bump(input: {
    day: Date;
    serviceId: string;
    kind: RecommendationEventKind;
  }): Promise<void> {
    await this.prisma.recommendedServiceMetric.upsert({
      where: {
        day_serviceId_kind: { day: input.day, serviceId: input.serviceId, kind: input.kind },
      },
      create: {
        id: uuidv7(),
        day: input.day,
        serviceId: input.serviceId,
        kind: input.kind,
        count: 1,
      },
      update: { count: { increment: 1 } },
    });
  }

  async summarize(input: { from: Date; to: Date }): Promise<MetricRow[]> {
    const rows = await this.prisma.recommendedServiceMetric.groupBy({
      by: ['serviceId', 'kind'],
      where: { day: { gte: input.from, lte: input.to } },
      _sum: { count: true },
      orderBy: [{ serviceId: 'asc' }, { kind: 'asc' }],
    });
    return rows.map((row) => ({
      serviceId: row.serviceId,
      kind: row.kind as RecommendationEventKind,
      count: row._sum.count ?? 0,
    }));
  }
}
