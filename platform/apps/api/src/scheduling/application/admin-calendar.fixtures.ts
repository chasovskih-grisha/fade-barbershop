// Спільні фікстури спеків календаря (вікна день/тиждень + підпис референсів):
// рядок Booking з дефолтами й фабрика read-моделі на фейках Prisma та порту
// ReferencePhotoUrls (fakes.ts-конвенція, але тут — fixtures: це дані, не порт).
import { AdminCalendar, type CalendarVisit } from './admin-calendar';

export const row = (
  overrides: Partial<CalendarVisit & { start: Date; end: Date; status: string | null }> = {}
) => ({
  id: 'bk-1',
  appointmentId: null as string | null,
  locationId: 'loc-1',
  barberId: 'barber-1',
  start: new Date('2026-11-09T10:00:00.000Z'),
  end: new Date('2026-11-09T10:30:00.000Z'),
  status: null,
  serviceId: null,
  agreedPrice: null,
  partyId: null,
  partyRole: null,
  haircutReferenceId: null,
  appointmentComment: null,
  ...overrides,
});

/** Read-модель на фейках: `urls` — що поверне порт підпису. */
export function setup(rows: ReturnType<typeof row>[] = [], urls: [string, string][] = []) {
  const findMany = jest.fn().mockResolvedValue(rows);
  const sign = jest.fn().mockResolvedValue(new Map(urls));
  const calendar = new AdminCalendar({
    prisma: { booking: { findMany } } as never,
    referencePhotoUrls: { sign },
  });
  return { calendar, findMany, sign };
}
