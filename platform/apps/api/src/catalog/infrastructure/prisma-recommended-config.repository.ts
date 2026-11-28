// Prisma-адаптер конфігу блоку «рекомендуємо» (T-4445): один рядок на локацію,
// NULL locationId — мережевий дефолт. Унікальний індекс на nullable-колонці не
// приймає null у where, тож пошук іде через findFirst.
import { Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { RecommendedConfig, RecommendationMode } from '../domain/recommended-services';
import type { RecommendedConfigRepository } from '../application/recommended-ports';

const toConfig = (row: {
  locationId: string | null;
  mode: string;
  serviceIds: string[];
  limit: number;
}): RecommendedConfig => ({
  locationId: row.locationId,
  mode: row.mode as RecommendationMode,
  serviceIds: row.serviceIds,
  limit: row.limit,
});

@Injectable()
export class PrismaRecommendedConfigRepository implements RecommendedConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  async find(locationId: string | null): Promise<RecommendedConfig | null> {
    const row = await this.prisma.recommendedServicesConfig.findFirst({ where: { locationId } });
    return row ? toConfig(row) : null;
  }

  async save(config: RecommendedConfig): Promise<RecommendedConfig> {
    const existing = await this.prisma.recommendedServicesConfig.findFirst({
      where: { locationId: config.locationId },
    });
    const data = {
      mode: config.mode,
      serviceIds: config.serviceIds,
      limit: config.limit,
    };
    const row = existing
      ? await this.prisma.recommendedServicesConfig.update({ where: { id: existing.id }, data })
      : await this.prisma.recommendedServicesConfig.create({
          data: { id: uuidv7(), locationId: config.locationId, ...data },
        });
    return toConfig(row);
  }
}
