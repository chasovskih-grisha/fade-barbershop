// Фільтр по статусу + сортування за датою для списків візитів кабінету.
// Чиста функція окремо від розмітки (LOC-гейт ADR 0019).
import type { ExtendedAppointment } from '@/lib/api/appointments';
import type { VisitSortOrder, VisitStatusFilter } from './VisitListControls';

const dateTime = (app: ExtendedAppointment) => `${app.date} ${app.startTime}`;

export function prepareVisits(
  list: ExtendedAppointment[],
  status: VisitStatusFilter,
  order: VisitSortOrder
): ExtendedAppointment[] {
  const filtered = status === 'all' ? list : list.filter((app) => app.status === status);
  return [...filtered].sort((a, b) =>
    order === 'asc'
      ? dateTime(a).localeCompare(dateTime(b))
      : dateTime(b).localeCompare(dateTime(a))
  );
}
