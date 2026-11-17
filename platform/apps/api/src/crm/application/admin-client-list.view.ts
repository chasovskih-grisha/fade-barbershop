// Мапінг і порівняння списку клієнтів (T-4606a) — окремо від read-моделі
// (гейт max-lines): DTO рядка таблиці §6.1 і сортування visits/lastVisit, у
// якому рядок без візитів завжди наприкінці, незалежно від напряму (як
// sortRows на фронті).
import type { ClientListProfileRow, VisitStatRow } from './client-list-reader';
import type { ClientListSummary } from './client-list-summary';

export interface ClientListItem {
  id: string;
  userId: string;
  name: string | null;
  phone: string;
  visits: number;
  /** ISO-час останнього візиту; null — ще не був. */
  lastVisit: string | null;
  /** Прогрес лояльності «X/7» (LYL-ADM-02); ціль 7 — на боці UI. */
  loyaltyVisits: number;
  vipDiscountPercent: number | null;
}

export interface ClientListResult {
  items: ClientListItem[];
  total: number;
  page: number;
  pages: number;
  /**
   * Стрічка підсумків (T-4606b): цифри по всьому фільтру, не по сторінці.
   * `summary.total` — те саме число, що й `total` таблиці.
   */
  summary: ClientListSummary;
}

/** Сторінка без зведення: його додає handle() (T-4606b). */
export type ClientListPage = Omit<ClientListResult, 'summary'>;

type Keyed = { id: string; userId: string };

const NO_VISITS: VisitStatRow = { clientId: '', visits: 0, lastVisit: null };

/** Статистика рядка: Booking.clientId зберігає User.id або ClientProfile.id. */
export const statFor = (stats: Map<string, VisitStatRow>, row: Keyed): VisitStatRow =>
  stats.get(row.id) ?? stats.get(row.userId) ?? NO_VISITS;

/** Порівняння visits/lastVisit; рядок без візитів — наприкінці завжди. */
export function compareStat(a: VisitStatRow, b: VisitStatRow, key: 'visits' | 'lastVisit'): number {
  if (key === 'visits') return a.visits - b.visits;
  if (!a.lastVisit && !b.lastVisit) return 0;
  if (!a.lastVisit) return 1;
  if (!b.lastVisit) return -1;
  return a.lastVisit.getTime() - b.lastVisit.getTime();
}

/** Рядок профілю + статистика → DTO таблиці §6.1. */
export const item = (row: ClientListProfileRow, stat: VisitStatRow): ClientListItem => ({
  id: row.id,
  userId: row.userId,
  name: row.name,
  phone: row.phone,
  visits: stat.visits,
  lastVisit: stat.lastVisit ? stat.lastVisit.toISOString() : null,
  loyaltyVisits: row.loyaltyVisitsCount,
  vipDiscountPercent: row.vipDiscountPercent,
});
