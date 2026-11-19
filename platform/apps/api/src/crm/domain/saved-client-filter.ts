/**
 * T-4461: збережені CRM-фільтри — чиста політика.
 *
 * Збережений фільтр — це **лише запит**, а не нова сутність сегмента: він
 * зберігає канонічний набір параметрів списку клієнтів (T-4606a) і повторно
 * виконується на читання, тож змінені мітки/статуси клієнтів не «застигають»
 * у прев'ю. Пагінація в збережений фільтр не входить: він завжди
 * відкривається з першої сторінки.
 *
 * Набір параметрів навмисно обмежений тим, що реально вміє
 * `GET /admin/clients` (search, locationId, loyaltyStatus, sort, order,
 * perPage, period). Полів, яких списку ще не вміє (стать, мітки T-4424,
 * довільний діапазон дат), тут немає — інакше фільтр зберігав би те, що
 * неможливо виконати.
 */
import {
  CLIENT_SORTS,
  CLIENT_SUMMARY_PERIODS,
  parseClientListQuery,
  type ClientSortKey,
  type LoyaltyStatus,
  type SortDir,
  type SummaryPeriod,
} from '../application/admin-client-list.query';
import { InvalidClientListQueryError, SavedFilterConflictError } from '../application/crm-errors';

export const SAVED_FILTER_NAME_MAX_LENGTH = 60;
export const MAX_SAVED_FILTERS_PER_OWNER = 20;

/** Канонічний запит збереженого фільтра (без `page`). */
export interface SavedFilterQuery {
  search?: string;
  locationId?: string;
  loyaltyStatus?: LoyaltyStatus;
  sort: ClientSortKey;
  order: SortDir;
  perPage: number;
  period: SummaryPeriod;
}

export interface SavedClientFilter {
  id: string;
  ownerId: string;
  name: string;
  query: SavedFilterQuery;
  createdAt: Date;
  updatedAt: Date;
}

const LOYALTY_LABELS: Record<LoyaltyStatus, string> = {
  active: 'активні',
  inactive: 'неактивні',
};

const PERIOD_LABELS: Record<SummaryPeriod, string> = {
  '7d': '7 днів',
  '30d': '30 днів',
  '90d': '90 днів',
};

/** Валідація назви: не порожня, до 60 символів. */
export function validateFilterName(name: string): string[] {
  const trimmed = typeof name === 'string' ? name.trim() : '';
  const errors: string[] = [];
  if (!trimmed) errors.push('Filter name is required');
  if (trimmed.length > SAVED_FILTER_NAME_MAX_LENGTH) {
    errors.push(`Filter name must be ≤ ${SAVED_FILTER_NAME_MAX_LENGTH} characters`);
  }
  return errors;
}

/**
 * Нормалізує сирий запит у канонічний вигляд.
 * Валідацію робить `parseClientListQuery` (той самий контракт, що й список),
 * тому збережений фільтр не може містити невідомого параметра з масиву.
 */
export function normalizeSavedFilterQuery(raw: Record<string, string | undefined>): SavedFilterQuery {
  if (raw.page !== undefined && raw.page !== '') {
    throw new InvalidClientListQueryError('saved filters always start at page 1');
  }

  const parsed = parseClientListQuery(raw);
  const query: SavedFilterQuery = {
    sort: parsed.sort,
    order: parsed.order,
    perPage: parsed.perPage,
    period: parsed.period,
  };
  if (parsed.search) query.search = parsed.search;
  if (parsed.locationId) query.locationId = parsed.locationId;
  if (parsed.loyaltyStatus) query.loyaltyStatus = parsed.loyaltyStatus;
  return query;
}

/** Людський підпис для списку збережених фільтрів (адмінка, §6). */
export function savedFilterLabel(query: SavedFilterQuery): string {
  const parts: string[] = [];
  if (query.search) parts.push(`пошук: ${query.search}`);
  if (query.locationId) parts.push(query.locationId);
  if (query.loyaltyStatus) parts.push(LOYALTY_LABELS[query.loyaltyStatus]);
  parts.push(PERIOD_LABELS[query.period]);
  return parts.join(' · ');
}

/** Перетворює збережений запит назад у query-параметри для списку. */
export function toListParams(
  query: SavedFilterQuery,
  page: number = 1
): Record<string, string | undefined> {
  if (!Number.isInteger(page) || page < 1) {
    throw new InvalidClientListQueryError('page must be >= 1');
  }
  return {
    search: query.search,
    locationId: query.locationId,
    loyaltyStatus: query.loyaltyStatus,
    sort: query.sort,
    order: query.order,
    perPage: String(query.perPage),
    period: query.period,
    page: String(page),
  };
}

/** Створює новий збережений фільтр (назва й запит уже провалідовані). */
export function createSavedFilter(input: {
  id: string;
  ownerId: string;
  name: string;
  query: Record<string, string | undefined>;
  at?: Date;
}): SavedClientFilter {
  const errors = validateFilterName(input.name);
  if (errors.length > 0) throw new InvalidClientListQueryError(errors.join('; '));

  const at = input.at ?? new Date();
  const query = normalizeSavedFilterQuery(input.query);
  return {
    id: input.id,
    ownerId: input.ownerId,
    name: input.name.trim(),
    query,
    createdAt: at,
    updatedAt: at,
  };
}

/** Перейменування; запит і власник не змінюються. */
export function renameSavedFilter(
  filter: SavedClientFilter,
  name: string,
  at: Date = new Date()
): SavedClientFilter {
  const errors = validateFilterName(name);
  if (errors.length > 0) throw new InvalidClientListQueryError(errors.join('; '));
  return { ...filter, name: name.trim(), updatedAt: at };
}

/** Оновлення запиту збереженого фільтра (те саме «зберегти як»). */
export function updateSavedFilterQuery(
  filter: SavedClientFilter,
  query: Record<string, string | undefined>,
  at: Date = new Date()
): SavedClientFilter {
  return { ...filter, query: normalizeSavedFilterQuery(query), updatedAt: at };
}

/**
 * Унікальність назви й квота на власника. Перевіряються до збереження, щоб
 * адмінка не показувала два однакові фільтри й не росла без межі.
 */
export function assertFilterCanBeSaved(
  existing: SavedClientFilter[],
  input: { ownerId: string; name: string; ignoreId?: string }
): void {
  const name = input.name.trim().toLocaleLowerCase('uk-UA');
  const duplicate = existing.find(
    (filter) =>
      filter.ownerId === input.ownerId &&
      filter.id !== input.ignoreId &&
      filter.name.toLocaleLowerCase('uk-UA') === name
  );
  if (duplicate) throw new SavedFilterConflictError(`Filter "${input.name.trim()}" already exists`);

  const owned = existing.filter(
    (filter) => filter.ownerId === input.ownerId && filter.id !== input.ignoreId
  );
  if (owned.length >= MAX_SAVED_FILTERS_PER_OWNER) {
    throw new SavedFilterConflictError(
      `Saved filter limit reached (${MAX_SAVED_FILTERS_PER_OWNER} per owner)`
    );
  }
}

/** Чи належить фільтр власнику — чужі фільтри назовні не віддаємо. */
export function isOwnedBy(filter: SavedClientFilter, ownerId: string): boolean {
  return filter.ownerId === ownerId;
}

/** Список для адмінки: найновіші спершу, з підписом запиту. */
export function filterListItems(filters: SavedClientFilter[]): Array<{
  id: string;
  name: string;
  label: string;
  query: SavedFilterQuery;
  updatedAt: Date;
}> {
  return [...filters]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .map((filter) => ({
      id: filter.id,
      name: filter.name,
      label: savedFilterLabel(filter.query),
      query: filter.query,
      updatedAt: filter.updatedAt,
    }));
}

/** Санітарна перевірка канонічного запиту (внутрішній інваріант). */
export function isCanonicalQuery(query: SavedFilterQuery): boolean {
  return (
    CLIENT_SORTS.includes(query.sort) &&
    CLIENT_SUMMARY_PERIODS.includes(query.period) &&
    (query.order === 'asc' || query.order === 'desc') &&
    Number.isInteger(query.perPage) &&
    query.perPage >= 1 &&
    query.perPage <= 100
  );
}
