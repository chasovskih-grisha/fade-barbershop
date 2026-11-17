// Адаптер порту ClientListReader на Prisma (T-4606a): профілі — count/findMany
// зі складеним where; статистика візитів — один groupBy по Booking (лічильник +
// MAX(start)); члени locationId — distinct clientId. Кількість запитів не залежить
// від розміру сторінки — без N+1 (Done T-4606a). `where` — спільний
// client-list-where.ts, факти зведення (T-4606b) — client-summary-facts.reader.ts.
import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  type ClientListProfileRow,
  type ClientListReader,
  type ClientListWhere,
  type ProfileOrder,
  type VisitStatRow,
} from '../application/client-list-reader';
import type { ClientListFacts, SummaryWindow } from '../application/client-list-summary';
import { PrismaClientSummaryFacts } from './client-summary-facts.reader';
import { profileWhere } from './client-list-where';

// prettier-ignore
const ORDER_FIELD: Record<ProfileOrder['key'], string> = {
  name: 'name', phone: 'phone', loyalty: 'loyaltyVisitsCount', vip: 'vipDiscountPercent',
};

@Injectable()
export class PrismaClientListReader implements ClientListReader {
  /** Факти зведення — окремий адаптер (гейт max-lines), той самий `where`. */
  private readonly facts: PrismaClientSummaryFacts;

  constructor(private readonly prisma: PrismaService) {
    this.facts = new PrismaClientSummaryFacts(prisma);
  }

  async count(where: ClientListWhere): Promise<number> {
    return this.prisma.clientProfile.count({ where: profileWhere(where) });
  }

  async page(
    where: ClientListWhere,
    order: ProfileOrder,
    range: { limit: number; offset: number }
  ): Promise<ClientListProfileRow[]> {
    const orderBy = {
      [ORDER_FIELD[order.key]]: order.dir,
    } as Prisma.ClientProfileOrderByWithRelationInput;
    return this.prisma.clientProfile.findMany({
      where: profileWhere(where),
      orderBy,
      skip: range.offset,
      take: range.limit,
    });
  }

  async keys(where: ClientListWhere): Promise<{ id: string; userId: string }[]> {
    return this.prisma.clientProfile.findMany({
      where: profileWhere(where),
      select: { id: true, userId: true },
    });
  }

  async byIds(ids: string[]): Promise<ClientListProfileRow[]> {
    if (ids.length === 0) return [];
    return this.prisma.clientProfile.findMany({ where: { id: { in: ids } } });
  }

  async visitStats(clientIds: string[]): Promise<VisitStatRow[]> {
    if (clientIds.length === 0) return [];
    // prettier-ignore
    const rows = await this.prisma.booking.groupBy({
      by: ['clientId'], where: { clientId: { in: clientIds } },
      _count: { _all: true }, _max: { start: true },
    });
    return rows.flatMap((row) =>
      row.clientId
        ? [{ clientId: row.clientId, visits: row._count._all, lastVisit: row._max.start }]
        : []
    );
  }

  async locationVisitors(locationId: string): Promise<string[]> {
    // prettier-ignore
    const rows = await this.prisma.booking.findMany({
      where: { locationId, clientId: { not: null } },
      distinct: ['clientId'], select: { clientId: true },
    });
    return rows.flatMap((row) => (row.clientId ? [row.clientId] : []));
  }

  /** Факти зведення (T-4606b) — делегує окремому адаптеру (3 запити). */
  async summary(where: ClientListWhere, window: SummaryWindow): Promise<ClientListFacts> {
    return this.facts.load(where, window);
  }
}
