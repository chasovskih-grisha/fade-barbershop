// Форма запиту й валідація списку клієнтів (T-4606a, admin-screens §6.1;
// docs/admin/16-shared.md §Pagination/§Filtering): сортування — лише закритий
// набір колонок §6.1, perPage 1..100, некоректні значення → 400 (через
// InvalidClientListQueryError у CrmExceptionFilter). Валідація чистою функцією
// без class-validator — за патерном read-моделі AdminCalendar.
import { InvalidClientListQueryError } from './crm-errors';

/** Колонки §6.1, за якими дозволено сортування (закритий набір — T-4606). */
export const CLIENT_SORTS = ['name', 'phone', 'visits', 'lastVisit', 'loyalty', 'vip'] as const;
export type ClientSortKey = (typeof CLIENT_SORTS)[number];
export type SortDir = 'asc' | 'desc';
export type LoyaltyStatus = 'active' | 'inactive';
/**
 * Період підсумків (T-4606b, контракт T-4606 §6.1): закритий набір вікон.
 * Вікно змінює лише цифри зведення — таблиця і пагінація від нього не залежать.
 */
export const CLIENT_SUMMARY_PERIODS = ['7d', '30d', '90d'] as const;
export type SummaryPeriod = (typeof CLIENT_SUMMARY_PERIODS)[number];

const LOYALTY_STATUSES: LoyaltyStatus[] = ['active', 'inactive'];
const ORDERS: SortDir[] = ['asc', 'desc'];
const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 100;
const DEFAULT_PERIOD: SummaryPeriod = '30d';

/** Нормалізація пошукового рядка до телефону: E.164 (+380…), інакше — цифри. */
export function normalizePhoneSearch(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 6) return null;
  if (digits.startsWith('380') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('80') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 10) return `+38${digits}`;
  return digits; // фрагмент номера — пошук підрядком цифр
}

export interface ClientListQuery {
  search: string;
  phoneSearch: string | null;
  locationId?: string;
  loyaltyStatus?: LoyaltyStatus;
  sort: ClientSortKey;
  order: SortDir;
  page: number;
  perPage: number;
  period: SummaryPeriod;
}

const int = (raw: string | undefined, field: string, fallback: number): number => {
  if (raw === undefined || raw === '') return fallback;
  if (!/^\d+$/.test(raw)) throw new InvalidClientListQueryError(`${field} must be an integer`);
  return Number(raw);
};

/** Закритий набір: порожнє значення — undefined (дефолт ставить виклик). */
const oneOf = <T extends string>(
  raw: string | undefined,
  field: string,
  allowed: readonly T[]
): T | undefined => {
  if (raw === undefined || raw === '') return undefined;
  if (!allowed.includes(raw as T)) throw new InvalidClientListQueryError(`${field} "${raw}"`);
  return raw as T;
};

/** Пагінація: page ≥ 1, perPage 1..100 (16-shared §Pagination). */
function parseRange(raw: Record<string, string | undefined>): { page: number; perPage: number } {
  const page = int(raw.page, 'page', 1);
  if (page < 1) throw new InvalidClientListQueryError('page must be >= 1');
  const perPage = int(raw.perPage, 'perPage', DEFAULT_PER_PAGE);
  if (perPage < 1 || perPage > MAX_PER_PAGE)
    throw new InvalidClientListQueryError(`perPage must be 1..${MAX_PER_PAGE}`);
  return { page, perPage };
}

/** Розбір і валідація query-параметрів GET /admin/clients. */
export function parseClientListQuery(raw: Record<string, string | undefined>): ClientListQuery {
  const { page, perPage } = parseRange(raw);
  const search = (raw.search ?? '').trim();
  const locationId = (raw.locationId ?? '').trim();
  const loyaltyStatus = oneOf(raw.loyaltyStatus, 'loyaltyStatus', LOYALTY_STATUSES);
  return {
    search,
    phoneSearch: normalizePhoneSearch(search),
    ...(locationId ? { locationId } : {}),
    ...(loyaltyStatus ? { loyaltyStatus } : {}),
    sort: oneOf(raw.sort, 'sort', CLIENT_SORTS) ?? 'name',
    order: oneOf(raw.order, 'order', ORDERS) ?? 'asc',
    period: oneOf(raw.period, 'period', CLIENT_SUMMARY_PERIODS) ?? DEFAULT_PERIOD,
    page,
    perPage,
  };
}
