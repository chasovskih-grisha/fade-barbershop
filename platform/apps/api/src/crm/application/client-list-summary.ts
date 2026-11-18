// Розрахунок зведення списку клієнтів (T-4606b, admin-screens §6.1) — чиста
// функція від фактів фільтрованої множини до метрик: без Prisma, без
// системного часу, без пагінації. `total` приходить ззовні (той самий фільтр,
// що й таблиця), тож `summary.total === total` тримається структурою, а не
// збігом двох запитів. Контракт і вікно — client-list-summary.types.ts.
import { DAY_MS, QUIET_DAYS, summaryWindow, type ClientListFacts, type ClientListSummary, type LoyaltyDistribution, type LocationDistribution, type SummaryProfileFact, type SummaryWindowFact } from './client-list-summary.types';
import type { SummaryPeriod } from './admin-client-list.query';

export * from './client-list-summary.types';

/** Межа безкоштовного візиту: 6/7 → FreeVisitGranted (LYL-004…007). */
const FREE_VISIT_AT = 6;

/** Частка без ділення на нуль: порожній знаменник — 0, а не NaN. */
const ratio = (part: number, whole: number): number =>
  whole > 0 ? Math.round((part / whole) * 10000) / 10000 : 0;

const loyaltyBuckets = (profiles: SummaryProfileFact[]): LoyaltyDistribution => {
  const buckets: LoyaltyDistribution = { none: 0, progress: 0, freeVisit: 0, cycle: 0 };
  for (const profile of profiles) {
    const visits = profile.loyaltyVisits;
    if (visits <= 0) buckets.none += 1;
    else if (visits < FREE_VISIT_AT) buckets.progress += 1;
    else if (visits === FREE_VISIT_AT) buckets.freeVisit += 1;
    else buckets.cycle += 1;
  }
  return buckets;
};

/** Розподіл за локацією останнього візиту; без візитів — окремо. */
const locationBuckets = (profiles: SummaryProfileFact[]): LocationDistribution => {
  const counts = new Map<string, number>();
  let noVisit = 0;
  for (const profile of profiles) {
    if (!profile.lastVisitLocation) noVisit += 1;
    else counts.set(profile.lastVisitLocation, (counts.get(profile.lastVisitLocation) ?? 0) + 1);
  }
  const byLocation = [...counts.entries()]
    .map(([locationId, count]) => ({ locationId, count }))
    .sort((a, b) => b.count - a.count || a.locationId.localeCompare(b.locationId));
  return { byLocation, noVisit };
};

/**
 * «Тихий» = немає візиту 90+ днів. Без візитів узагалі відлік іде від
 * реєстрації: щойно зареєстрований гість — не «тихий», він ще не встиг прийти.
 */
const quietCount = (profiles: SummaryProfileFact[], cutoff: number): number =>
  profiles.filter((profile) =>
    profile.lastVisitAt
      ? profile.lastVisitAt.getTime() < cutoff
      : profile.createdAt.getTime() < cutoff
  ).length;

/** Суми по статусах у вікні: візити, no-show, виручка завершених. */
const windowTotals = (rows: SummaryWindowFact[]) => {
  let visits = 0;
  let noShow = 0;
  let completed = 0;
  let revenue = 0;
  for (const row of rows) {
    visits += row.count;
    if (row.status === 'no_show') noShow += row.count;
    // Виручка — лише завершені візити з ціною (як KPI-дашборд).
    if (row.status === 'completed') {
      completed += row.count;
      revenue += row.revenue;
    }
  }
  return { visits, noShow, completed, revenue };
};

/** Факти фільтрованої множини + вікно → цифри стрічки підсумків §6.1. */
export function buildClientListSummary(input: {
  total: number;
  period: SummaryPeriod;
  now: Date;
  facts: ClientListFacts;
}): ClientListSummary {
  const { total, period, now, facts } = input;
  const window = summaryWindow(period, now);
  const cutoff = now.getTime() - QUIET_DAYS * DAY_MS;
  const { visits, noShow, completed, revenue } = windowTotals(facts.window);
  const quietClients = quietCount(facts.profiles, cutoff);
  const repeat = facts.profiles.filter((profile) => profile.visits > 1).length;
  return {
    total,
    period,
    from: window.from.toISOString(),
    to: window.to.toISOString(),
    newClients: facts.profiles.filter(
      (profile) => profile.createdAt.getTime() >= window.from.getTime()
    ).length,
    visits,
    revenue,
    avgTicket: completed > 0 ? Math.round(revenue / completed) : 0,
    noShowRate: ratio(noShow, visits),
    quietClients,
    quietShare: ratio(quietClients, facts.profiles.length),
    repeatShare: ratio(repeat, facts.profiles.length),
    loyalty: loyaltyBuckets(facts.profiles),
    locations: locationBuckets(facts.profiles),
  };
}
