// Читання фактів зведення списку клієнтів (T-4606b) — окремий адаптер
// (гейт max-lines, ADR 0019), споживає той самий `profileWhere`, що й сторінка.
// Рівно 3 запити незалежно від розміру фільтра: профілі, візити у вікні за
// статусом, візити за всі часи по клієнтах (клієнт × локація) — без N+1.
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { ClientListWhere } from '../application/client-list-reader';
import type { ClientListFacts, SummaryWindow } from '../application/client-list-summary';
import { reduceProfiles, reduceWindow } from './client-list-facts.reduce';
import { profileWhere } from './client-list-where';

export class PrismaClientSummaryFacts {
  constructor(private readonly prisma: PrismaService) {}

  async load(where: ClientListWhere, window: SummaryWindow): Promise<ClientListFacts> {
    // prettier-ignore
    const profiles = await this.prisma.clientProfile.findMany({
      where: profileWhere(where),
      select: { id: true, userId: true, createdAt: true, loyaltyVisitsCount: true },
    });
    if (profiles.length === 0) return { profiles: [], window: [] };
    const keys = [...new Set(profiles.flatMap((profile) => [profile.id, profile.userId]))];
    const [windowRows, allTime] = await Promise.all([
      this.prisma.booking.groupBy({
        by: ['status'],
        where: { clientId: { in: keys }, start: { gte: window.from, lte: window.to } },
        _count: { _all: true },
        _sum: { agreedPrice: true },
      }),
      this.prisma.booking.groupBy({
        by: ['clientId', 'locationId'],
        where: { clientId: { in: keys } },
        _count: { _all: true },
        _max: { start: true },
      }),
    ]);
    return {
      profiles: reduceProfiles(
        profiles,
        allTime.flatMap((row) =>
          row.clientId
            ? [
                {
                  clientId: row.clientId,
                  locationId: row.locationId,
                  count: row._count._all,
                  lastStart: row._max.start,
                },
              ]
            : []
        )
      ),
      window: reduceWindow(
        windowRows.map((row) => ({
          status: row.status,
          count: row._count._all,
          revenue: row._sum.agreedPrice,
        }))
      ),
    };
  }
}
