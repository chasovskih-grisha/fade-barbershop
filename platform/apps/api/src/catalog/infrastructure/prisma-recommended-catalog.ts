// Каталог для блоку «рекомендуємо» (T-4445): що тут справді продається, і попит
// за тиждень із записів. Читає ті самі джерела, що й публічне меню.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { RecommendedService, ServiceDemand } from '../domain/recommended-services';
import type { RecommendedCatalogPort, ServiceDemandReader } from '../application/recommended-ports';
import { catalogForLocation } from './service-price-queries';

@Injectable()
export class PrismaRecommendedCatalog implements RecommendedCatalogPort, ServiceDemandReader {
  constructor(private readonly prisma: PrismaService) {}

  async listSellable(locationId: string | null): Promise<RecommendedService[]> {
    if (locationId) {
      const rows = await catalogForLocation(this.prisma, locationId);
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        duration: row.duration,
        category: row.category,
        priceUah: row.price,
      }));
    }
    const rows = await this.prisma.service.findMany({
      where: { active: true, isAddon: false },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      duration: row.duration,
      category: row.category,
      priceUah: null,
    }));
  }

  async topServices(input: {
    from: Date;
    to: Date;
    locationId: string | null;
    limit: number;
  }): Promise<ServiceDemand[]> {
    const rows = await this.prisma.booking.groupBy({
      by: ['serviceId'],
      where: {
        serviceId: { not: null },
        start: { gte: input.from, lt: input.to },
        ...(input.locationId ? { locationId: input.locationId } : {}),
      },
      _count: { _all: true },
      orderBy: [{ _count: { serviceId: 'desc' } }],
      take: input.limit * 2,
    });
    return rows
      .filter((row): row is typeof row & { serviceId: string } => Boolean(row.serviceId))
      .map((row) => ({ serviceId: row.serviceId, bookings: row._count._all }));
  }
}
