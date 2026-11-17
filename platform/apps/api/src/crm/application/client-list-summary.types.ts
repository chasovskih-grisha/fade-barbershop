// Контракт зведення списку клієнтів (T-4606b): константи, типи фактів і форма
// відповіді — окремо від розрахунку (гейт max-lines, ADR 0019). Формули —
// `docs/ubiquitous-language.md` (AvgTicket, NoShowRate), поріг «тихих» 90 днів
// — як у NSH-ADM-01; рішення «перерахунок, а не проєкція» — README crm.
import type { SummaryPeriod } from './admin-client-list.query';

/** Днів у кожному вікні підсумків: «нові» і «візити за період» — у ньому. */
export const SUMMARY_PERIOD_DAYS: Record<SummaryPeriod, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};
/** Поріг «тихого» клієнта: без візиту 90+ днів (T-4606 §6.1). */
export const QUIET_DAYS = 90;
export const DAY_MS = 24 * 60 * 60 * 1000;

export interface SummaryWindow {
  from: Date;
  to: Date;
}

/** Профіль фільтра зі статистикою візитів за всі часи (редукція — адаптер). */
export interface SummaryProfileFact {
  createdAt: Date;
  loyaltyVisits: number;
  /** Візитів за всі часи; 0 — жодного (гостьового запису без профілю тут немає). */
  visits: number;
  lastVisitAt: Date | null;
  /** Локація останнього візиту; null — візитів не було. */
  lastVisitLocation: string | null;
}

/** Візити у вікні підсумків, згруповані за статусом. */
export interface SummaryWindowFact {
  status: string | null;
  count: number;
  /** Σ AgreedPrice групи; у незавершених статусів може бути 0. */
  revenue: number;
}

/** Факти фільтрованої множини: один рядок на профіль, без пагінації. */
export interface ClientListFacts {
  profiles: SummaryProfileFact[];
  window: SummaryWindowFact[];
}

export interface LoyaltyDistribution {
  none: number;
  progress: number;
  freeVisit: number;
  cycle: number;
}

export interface LocationDistribution {
  byLocation: { locationId: string; count: number }[];
  /** Клієнти без жодного візиту — не приписані жодній локації. */
  noVisit: number;
}

export interface ClientListSummary {
  /** Той самий `total`, що й таблиця (контракт `summary.total === total`). */
  total: number;
  period: SummaryPeriod;
  /** Межі вікна підсумків у ISO — UI показує, що саме пораховано. */
  from: string;
  to: string;
  newClients: number;
  visits: number;
  revenue: number;
  avgTicket: number;
  noShowRate: number;
  quietClients: number;
  quietShare: number;
  repeatShare: number;
  loyalty: LoyaltyDistribution;
  locations: LocationDistribution;
}

/** Вікно підсумків від «зараз»: період змінює лише його, не таблицю. */
export function summaryWindow(period: SummaryPeriod, now: Date): SummaryWindow {
  const days = SUMMARY_PERIOD_DAYS[period];
  return { from: new Date(now.getTime() - days * DAY_MS), to: new Date(now.getTime()) };
}
