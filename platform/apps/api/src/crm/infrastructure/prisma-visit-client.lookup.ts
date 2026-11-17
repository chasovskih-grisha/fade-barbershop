// Адаптер VisitClientLookup на Prisma (crm, T-061): appointmentId → clientId
// через рядок Booking (appointmentId — колонка Booking, T-042a). Візит без
// клієнта (walk-in, WNB-005) → null, проєкція його не створює.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { VisitClientLookup } from '../application/record-visit.use-case';

@Injectable()
export class PrismaVisitClientLookup implements VisitClientLookup {
  constructor(private readonly prisma: PrismaService) {}

  async clientIdOf(appointmentId: string): Promise<string | null> {
    const row = await this.prisma.booking.findUnique({
      where: { appointmentId },
      select: { clientId: true },
    });
    return row?.clientId ?? null;
  }
}
