// Query-стан списку клієнтів (T-4606a): єдине джерело правди про параметри
// URL (фільтри/сортування/сторінка) для хука, сторінки й тестів. Стан живе в
// URL — «Назад» відновлює попередні фільтри, локального дубля немає.
import type { ReadonlyURLSearchParams } from 'next/navigation';

/** Вікно підсумків (T-4606b): закритий набір контракту API — 7d/30d/90d. */
export type SummaryPeriod = '7d' | '30d' | '90d';
export const SUMMARY_PERIODS: SummaryPeriod[] = ['7d', '30d', '90d'];
export const DEFAULT_PERIOD: SummaryPeriod = '30d';

export interface ClientListState {
  search: string;
  locationId: string;
  loyaltyStatus: string;
  sort: { key: string; dir: 'asc' | 'desc' };
  page: number;
  period: SummaryPeriod;
}

type Params = URLSearchParams | ReadonlyURLSearchParams;

/** Невідомий period у URL не має валити список: беремо дефолт, а не 400. */
const readPeriod = (value: string | null): SummaryPeriod =>
  SUMMARY_PERIODS.includes(value as SummaryPeriod) ? (value as SummaryPeriod) : DEFAULT_PERIOD;

export function readClientListState(params: Params): ClientListState {
  const page = Number(params.get('page') ?? 1);
  return {
    search: params.get('search') ?? '',
    locationId: params.get('locationId') ?? '',
    loyaltyStatus: params.get('loyaltyStatus') ?? '',
    sort: {
      key: params.get('sort') ?? 'name',
      dir: params.get('order') === 'desc' ? 'desc' : 'asc',
    },
    page: Number.isFinite(page) && page > 1 ? Math.floor(page) : 1,
    period: readPeriod(params.get('period')),
  };
}

/** Патч query-параметрів: порожнє значення видаляється з URL (не пишемо ?page=). */
export function applyParams(query: string, changes: Record<string, string>): string {
  const next = new URLSearchParams(query);
  for (const [key, value] of Object.entries(changes)) {
    if (value) next.set(key, value);
    else next.delete(key);
  }
  return next.toString();
}

/** Канонічний query лише з параметрами списку; значення за замовчуванням — порожні. */
export function clientListQuery(params: Params): string {
  const state = readClientListState(params);
  const next = new URLSearchParams();
  if (state.search) next.set('search', state.search);
  if (state.locationId) next.set('locationId', state.locationId);
  if (state.loyaltyStatus) next.set('loyaltyStatus', state.loyaltyStatus);
  if (state.sort.key !== 'name') next.set('sort', state.sort.key);
  if (state.sort.dir !== 'asc') next.set('order', state.sort.dir);
  if (state.page > 1) next.set('page', String(state.page));
  // Період впливає лише на зведення, але живе в URL — посиланням можна поділитись.
  if (state.period !== DEFAULT_PERIOD) next.set('period', state.period);
  return next.toString();
}
