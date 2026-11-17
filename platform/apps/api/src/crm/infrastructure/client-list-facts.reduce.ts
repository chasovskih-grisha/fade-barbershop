// Редукція рядків Prisma у факти зведення (T-4606b) — окремо від адаптера
// (гейт max-lines, ADR 0019). Функції чисті й працюють на простих формах, тож
// покриті юніт-тестами без БД: див. client-list-facts.reduce.spec.ts.
import type { SummaryProfileFact, SummaryWindowFact } from '../application/client-list-summary';

/** Рядок профілю (select у адаптері) — без доменних залежностей. */
export interface ProfileRowFact {
  id: string;
  userId: string;
  createdAt: Date;
  loyaltyVisitsCount: number;
}

/** Група «клієнт × локація» за всі часи: кількість і найпізніший старт. */
export interface AllTimeGroupFact {
  clientId: string;
  locationId: string;
  count: number;
  lastStart: Date | null;
}

/** Група візитів у вікні за статусом. */
export interface WindowGroupFact {
  status: string | null;
  count: number;
  revenue: number | null;
}

interface Visits {
  visits: number;
  lastVisitAt: Date | null;
  lastVisitLocation: string | null;
}

/**
 * Статистика візитів на профіль. Ключ бронювання — `User.id` АБО
 * `ClientProfile.id` (два шляхи запису), тож профіль читається за `id`, а якщо
 * під ним візитів немає — за `userId`: та сама правило, що в рядку таблиці
 * (`statFor`), щоб суми підсумків не розходилися з числами рядків.
 */
export function reduceProfiles(
  profiles: ProfileRowFact[],
  groups: AllTimeGroupFact[]
): SummaryProfileFact[] {
  const byKey = new Map<string, Visits>();
  for (const group of groups) {
    const current = byKey.get(group.clientId) ?? {
      visits: 0,
      lastVisitAt: null,
      lastVisitLocation: null,
    };
    const later =
      group.lastStart && (!current.lastVisitAt || group.lastStart > current.lastVisitAt);
    byKey.set(group.clientId, {
      visits: current.visits + group.count,
      lastVisitAt: later ? group.lastStart : current.lastVisitAt,
      lastVisitLocation: later ? group.locationId : current.lastVisitLocation,
    });
  }
  // prettier-ignore
  const empty: Visits = { visits: 0, lastVisitAt: null, lastVisitLocation: null };
  return profiles.map((profile) => {
    const visits = byKey.get(profile.id) ?? byKey.get(profile.userId) ?? empty;
    return {
      createdAt: profile.createdAt,
      loyaltyVisits: profile.loyaltyVisitsCount,
      visits: visits.visits,
      lastVisitAt: visits.lastVisitAt,
      lastVisitLocation: visits.lastVisitLocation,
    };
  });
}

/** Групи візитів у вікні → факти для метрик (сума `agreedPrice` може бути 0). */
export function reduceWindow(rows: WindowGroupFact[]): SummaryWindowFact[] {
  // prettier-ignore
  return rows.map((row) => ({ status: row.status, count: row.count, revenue: row.revenue ?? 0 }));
}
