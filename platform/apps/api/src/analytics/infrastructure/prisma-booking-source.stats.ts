// Prisma-статистика каналів запису (T-4536): group by source за вікном старту.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type {
  BookingSourceCount,
  BookingSourceStats,
} from '../application/booking-source-breakdown';

@Injectable()
export class PrismaBookingSourceStats implements BookingSourceStats {
  constructor(private readonly prisma: PrismaService) {}

  async countsBetween(from: Date, to: Date): Promise<BookingSourceCount[]> {
    const rows = await this.prisma.booking.groupBy({
      by: ['source'],
      where: { start: { gte: from, lt: to } },
      _count: { _all: true },
    });
    // prettier-ignore
    return rows.map((row) => ({ source: row.source ?? 'unknown', count: row._count._all }));
  }
}
