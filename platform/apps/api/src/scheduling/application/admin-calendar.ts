// Read-модель календаря мережі (T-045, admin-screens §5.1): день/тиждень по
// локаціях/барберах, фільтр «з референсом / без» (REF-ADM-02). Read-side
// стиль BookingReader/AvailableSlots — Prisma напряму, без доменного порта
// (статус Appointment живе на рядку Booking, агрегат Booking його не несе).
// Форми запиту/візиту й мапер — в admin-calendar.view.ts.

import { Injectable } from '@nestjs/common';
import { InvalidSlotError } from '../domain/slot-validator';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { mapVisit, withReferencePhotoUrl } from './admin-calendar.view';
import { bookingSourceFilter } from '../domain/booking-source';
import type { CalendarQuery, CalendarVisit } from './admin-calendar.view';
import type { ReferencePhotoUrls } from './reference-photo-urls';

export type { CalendarView, ReferenceFilter } from './admin-calendar.view';
export type { CalendarQuery, CalendarVisit } from './admin-calendar.view';

export interface AdminCalendarDeps {
  prisma: PrismaService;
  referencePhotoUrls: ReferencePhotoUrls;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class AdminCalendar {
  constructor(private readonly deps: AdminCalendarDeps) {}

  async handle(
    query: CalendarQuery
  ): Promise<{ from: string; to: string; visits: CalendarVisit[] }> {
    const { from, to } = this.window(query);
    const reference = query.reference ?? 'all';
    // prettier-ignore
    const rows = await this.deps.prisma.booking.findMany({
      where: {
        start: { lt: to },
        end: { gt: from },
        ...(query.locationId ? { locationId: query.locationId } : {}),
        ...(query.barberId ? { barberId: query.barberId } : {}),
        ...(reference === 'with' ? { haircutReferenceId: { not: null } } : {}),
        ...(reference === 'without' ? { haircutReferenceId: null } : {}),
        ...(query.status ? this.statusWhere(query.status) : {}),
        ...(query.source ? { source: { in: bookingSourceFilter(query.source) } } : {}),
      },
      orderBy: { start: 'asc' },
    });
    const visits = rows.map(mapVisit);
    return {
      from: from.toISOString(),
      to: to.toISOString(),
      visits: await this.signReferences(visits),
    };
  }

  /**
   * Підписує референси всіх візитів вікна ОДНИМ викликом порту (REF-ADM-01):
   * картка дня отримує URL разом із сіткою замість N запитів по картці.
   * Підписуємо лише ті візити, що мають референс — сітка часто без них узагалі.
   */
  private async signReferences(visits: CalendarVisit[]): Promise<CalendarVisit[]> {
    const urls = await this.deps.referencePhotoUrls.sign(
      visits.flatMap((visit) => visit.haircutReferenceId ?? [])
    );
    return visits.map((visit) => withReferencePhotoUrl(visit, urls));
  }

  /**
   * Фільтр за статусом. Рядок Booking без Appointment має status=null, який
   * мапер читає як 'booked' — тому «booked» має включати й null, щоб сітка не
   * ховала щойно створені записи.
   */
  private statusWhere(status: string): Record<string, unknown> {
    return status === 'booked' ? { OR: [{ status: 'booked' }, { status: null }] } : { status };
  }

  /** День: [00:00, +1d); тиждень: [понеділок 00:00, +7d) — модель Monday-first. */
  private window(query: CalendarQuery): { from: Date; to: Date } {
    // prettier-ignore
    if (!query.date || !DATE_RE.test(query.date)) throw InvalidSlotError.of('A calendar date is required');
    const start = new Date(`${query.date}T00:00:00.000Z`);
    // prettier-ignore
    if (!Number.isFinite(start.getTime())) throw InvalidSlotError.of('Invalid calendar date');
    if ((query.view ?? 'day') === 'week') {
      const monday = new Date(start);
      monday.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
      const to = new Date(monday);
      to.setUTCDate(monday.getUTCDate() + 7);
      return { from: monday, to };
    }
    const to = new Date(start);
    to.setUTCDate(start.getUTCDate() + 1);
    return { from: start, to };
  }
}
