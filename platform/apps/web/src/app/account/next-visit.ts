// «Найближчий візит» профілю (T-4716): вибір і форматування — окремо від
// розмітки (LOC-гейт ADR 0019). Джерело — той самий список, що вантажить
// сторінка візитів; картка не має другого джерела.
import type { ExtendedAppointment } from '@/lib/api/appointments';

const UPCOMING: ReadonlySet<ExtendedAppointment['status']> = new Set(['upcoming', 'confirmed']);

const startStamp = (visit: ExtendedAppointment) => `${visit.date} ${visit.startTime}`;

/** Найближчий майбутній візит зі списку; null — майбутніх немає. */
export function pickNextVisit(list: ExtendedAppointment[]): ExtendedAppointment | null {
  const upcoming = list.filter((visit) => UPCOMING.has(visit.status));
  if (upcoming.length === 0) return null;
  return [...upcoming].sort((a, b) => startStamp(a).localeCompare(startStamp(b)))[0] ?? null;
}

/** День тижня і дата в uk-UA; невідомий формат дати — як є. */
export function formatVisitDay(visit: ExtendedAppointment): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(visit.date);
  if (!match) return visit.date;
  const [, year, month, day] = match;
  return new Intl.DateTimeFormat('uk-UA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))));
}

/** Рядок 1 картки: день, дата і час початку–кінця (T-4716). */
export function formatVisitWhen(visit: ExtendedAppointment): string {
  const range = visit.endTime ? `${visit.startTime}–${visit.endTime}` : visit.startTime;
  return `${formatVisitDay(visit)} · ${range}`;
}

/** Рядок 2 картки: послуга, барбер, локація (T-4716). */
export function formatVisitWhere(visit: ExtendedAppointment): string {
  return [visit.serviceName, visit.barberName, visit.locationName].filter(Boolean).join(' • ');
}

/** Бейдж-попередження: візит ще очікує депозит (T-4716). */
export function waitingForDeposit(visit: ExtendedAppointment): boolean {
  return (visit.deposit?.amount ?? 0) > 0;
}
