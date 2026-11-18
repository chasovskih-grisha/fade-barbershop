// Довідкові функції сітки візитів (T-045/T-4524): імена барбера/локації за id і
// значення колонок для сортування. Винесено з VisitsTable за LOC-гейтом (ADR 0019).
import { STATUS_ORDER, type CalendarVisit } from './visit-status';

type Named = { id: string; name: string | null };
export type SortContext = { barbers: Named[]; locations: Named[] };

export const nameOf = (list: Named[], id: string): string | null =>
  list.find((item) => item.id === id)?.name ?? null;

export function visitSortValue(key: string, visit: CalendarVisit, ctx: SortContext): unknown {
  const VALUES: Record<string, (v: CalendarVisit) => unknown> = {
    start: (v) => v.start,
    status: (v) => STATUS_ORDER[v.status] ?? 99,
    barber: (v) => nameOf(ctx.barbers, v.barberId),
    location: (v) => nameOf(ctx.locations, v.locationId),
    price: (v) => v.agreedPrice,
  };
  return VALUES[key]?.(visit);
}
