// T-4464: джерело фактів заповненості з Booking (read-only).
// Рахуємо лише те, що реально займає час: скасування не займають крісло,
// no-show займає (слот був заблокований і не проданий).
import { Injectable } from '@nestjs/common';
import { prisma } from '../../index';
import type { SlowHoursSource } from '../application/get-slow-hours';
import type { OccupancyFact } from '../domain/slow-hours';

interface BookingRow {
  start: Date;
  end: Date;
}

@Injectable()
export class PrismaSlowHoursSource implements SlowHoursSource {
  async load(input: { from: Date; to: Date; locationId?: string }): Promise<OccupancyFact[]> {
    const rows = (await prisma.booking.findMany({
      where: {
        start: { lt: input.to },
        end: { gt: input.from },
        ...(input.locationId ? { locationId: input.locationId } : {}),
        NOT: { status: 'cancelled' },
      },
      select: { start: true, end: true },
    })) as BookingRow[];

    return rows
      .filter((row) => row.end.getTime() > row.start.getTime())
      .map((row) => ({ start: row.start, end: row.end }));
  }
}
