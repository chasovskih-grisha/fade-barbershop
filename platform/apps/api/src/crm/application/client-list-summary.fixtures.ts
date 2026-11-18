// Фікстури для спеків зведення (T-4606b) — окремий файл: гейт max-lines
// (ADR 0019) і один набір «зараз»/вікон для обох спеків.
import { buildClientListSummary, type ClientListFacts, type SummaryProfileFact } from './client-list-summary';
import type { SummaryPeriod } from './admin-client-list.query';

export const NOW = new Date('2026-10-10T00:00:00.000Z');
export const DAY_MS = 24 * 60 * 60 * 1000;
export const daysAgo = (n: number): Date => new Date(NOW.getTime() - n * DAY_MS);

/** Профіль зі статистикою візитів: за замовчуванням — старий і без візитів. */
export const profile = (over: Partial<SummaryProfileFact> = {}): SummaryProfileFact => ({
  createdAt: daysAgo(200),
  loyaltyVisits: 0,
  visits: 0,
  lastVisitAt: null,
  lastVisitLocation: null,
  ...over,
});

/** Зведення з дефолтами тесту: порожній фільтр, період 30d, «зараз» = NOW. */
export const build = (input: {
  total?: number;
  period?: SummaryPeriod;
  facts?: Partial<ClientListFacts>;
}) =>
  buildClientListSummary({
    total: input.total ?? 0,
    period: input.period ?? '30d',
    now: NOW,
    facts: { profiles: input.facts?.profiles ?? [], window: input.facts?.window ?? [] },
  });
