// Типи й мапінг read-моделі календаря (T-045, admin-screens §5.1) — окремо
// від AdminCalendar (query/window): форми + чистий мапер рядка Booking.
export type CalendarView = 'day' | 'week';
export type ReferenceFilter = 'all' | 'with' | 'without';

export interface CalendarQuery {
  /** YYYY-MM-DD; для view=week — будь-який день тижня (тиждень з понеділка). */
  date: string;
  view?: CalendarView;
  locationId?: string;
  barberId?: string;
  reference?: ReferenceFilter;
  /** Статус візита (AppointmentLifecycle): booked/confirmed/…; без фільтра — всі. */
  status?: string;
  /** Канал запису (T-4536): канонічне значення або аліас, можна список. */
  source?: string;
}

export interface CalendarVisit {
  /** appointmentId ?? bookingId — клік по комірці веде в картку візиту. */
  id: string;
  bookingId: string;
  appointmentId: string | null;
  locationId: string;
  barberId: string;
  start: string;
  end: string;
  status: string;
  serviceId: string | null;
  agreedPrice: number | null;
  partyId: string | null;
  partyRole: string | null;
  /** ID референса (маркер «є референс» у сітці) — деталі в картці (REF-ADM-01). */
  haircutReferenceId: string | null;
  /**
   * Підписаний URL референсу, підписаний разом із сіткою (REF-ADM-01): картка
   * дня показує фото без окремого запиту на кожен візит. null — референсу немає
   * або фото не існує/видалене. TTL — SIGNED_URL_TTL_SEC (15 хв), тож картка
   * має фолбек на GET /admin/reference-photos/:id, якщо зображення прострочене.
   */
  referencePhotoUrl: string | null;
  comment: string | null;
  /** Джерело запису (T-046, ANL-004) і посилання на клієнта (картка CRM). */
  source: string;
  clientId: string | null;
}

type BookingRow = {
  id: string;
  appointmentId: string | null;
  locationId: string;
  barberId: string;
  start: Date;
  end: Date;
  status: string | null;
  serviceId: string | null;
  agreedPrice: number | null;
  partyId: string | null;
  partyRole: string | null;
  haircutReferenceId: string | null;
  appointmentComment: string | null;
  clientId: string | null;
  source: string | null;
};

// prettier-ignore
export const mapVisit = (row: BookingRow): CalendarVisit => ({
  id: row.appointmentId ?? row.id, bookingId: row.id, appointmentId: row.appointmentId,
  locationId: row.locationId, barberId: row.barberId,
  start: row.start.toISOString(), end: row.end.toISOString(), status: row.status ?? 'booked',
  serviceId: row.serviceId, agreedPrice: row.agreedPrice, partyId: row.partyId, partyRole: row.partyRole,
  haircutReferenceId: row.haircutReferenceId, referencePhotoUrl: null,
  comment: row.appointmentComment, source: row.source ?? 'web', clientId: row.clientId,
});

/** Доповнює візит підписаним URL його референсу (REF-ADM-01). */
export const withReferencePhotoUrl = (
  visit: CalendarVisit,
  urls: Map<string, string>
): CalendarVisit =>
  visit.haircutReferenceId
    ? { ...visit, referencePhotoUrl: urls.get(visit.haircutReferenceId) ?? null }
    : visit;
