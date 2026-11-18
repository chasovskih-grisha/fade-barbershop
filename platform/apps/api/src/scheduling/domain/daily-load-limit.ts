// Обмеження денного навантаження (T-4421): правило домену scheduling —
// барбер приймає не більше N візитів за календарну добу локації.
// Ліміт — конфігурація локації; `null` означає «без обмеження», тож
// увімкнення правила нічого не змінює, доки ліміт не задано явно.

export interface DailyLoadPolicy {
  /** Максимум візитів на барбера за добу; null — без обмеження. */
  maxBookingsPerBarberPerDay: number | null;
}

export interface DatedBooking {
  barberId: string;
  start: Date;
}

export interface DailyLoadQuery {
  bookings: DatedBooking[];
  barberId: string;
  start: Date;
  policy: DailyLoadPolicy;
}

export interface DailyLoadBreach {
  barberId: string;
  day: string;
  count: number;
}

export const NO_DAILY_LOAD_LIMIT: DailyLoadPolicy = { maxBookingsPerBarberPerDay: null };

/** Календарна доба візиту в UTC-моделі слотів (той самий зріз, що day-of-week). */
export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isValidLimit(limit: number | null): limit is number {
  return limit !== null && Number.isInteger(limit) && limit >= 1;
}

/** Кількість візитів барбера в конкретну добу. */
export function bookingsOnDay(bookings: DatedBooking[], barberId: string, day: string): number {
  return bookings.filter(
    (booking) => booking.barberId === barberId && dayKey(booking.start) === day
  ).length;
}

/** Чи перевищить новий візит денний ліміт барбера. */
export function exceedsDailyLoad(query: DailyLoadQuery): boolean {
  const { bookings, barberId, start, policy } = query;
  if (!isValidLimit(policy.maxBookingsPerBarberPerDay)) return false;
  return bookingsOnDay(bookings, barberId, dayKey(start)) >= policy.maxBookingsPerBarberPerDay;
}

/** Барбери, у яких навантаження за добу вже на межі або вище — для звіту адмінки. */
export function overloadedBarbers(
  bookings: DatedBooking[],
  policy: DailyLoadPolicy
): DailyLoadBreach[] {
  if (!isValidLimit(policy.maxBookingsPerBarberPerDay)) return [];
  const counts = new Map<string, number>();
  for (const booking of bookings) {
    const key = `${booking.barberId}|${dayKey(booking.start)}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const breaches: DailyLoadBreach[] = [];
  for (const [key, count] of counts) {
    if (count < policy.maxBookingsPerBarberPerDay) continue;
    const [barberId, day] = key.split('|');
    if (!barberId || !day) continue;
    breaches.push({ barberId, day, count });
  }
  return breaches.sort((left, right) => left.day.localeCompare(right.day));
}
