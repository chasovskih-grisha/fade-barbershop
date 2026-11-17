// Юніт-тести розподілів зведення (T-4606b): «тихі» клієнти (поріг 90 днів і
// реєстрація як точка відліку без візитів), лояльність, локації останнього
// візиту і частка повторних. Метрики вікна — client-list-summary.spec.ts.
import { QUIET_DAYS } from './client-list-summary';
import { build, daysAgo, profile } from './client-list-summary.fixtures';

describe('buildClientListSummary (T-4606b) — «тихі» клієнти', () => {
  it('візит старіший за 90 днів — тихий; свіжий — ні', () => {
    const old = profile({
      visits: 3,
      lastVisitAt: daysAgo(QUIET_DAYS + 1),
      lastVisitLocation: 'loc-1',
    });
    const fresh = profile({
      visits: 1,
      lastVisitAt: daysAgo(QUIET_DAYS - 1),
      lastVisitLocation: 'loc-1',
    });
    expect(build({ facts: { profiles: [old] } }).quietClients).toBe(1);
    expect(build({ facts: { profiles: [fresh] } }).quietClients).toBe(0);
  });

  it('без візитів відлік іде від реєстрації: щойно зареєстрований — не тихий', () => {
    const justRegistered = profile({ createdAt: daysAgo(3) });
    const longAgo = profile({ createdAt: daysAgo(QUIET_DAYS + 5) });
    expect(build({ facts: { profiles: [justRegistered] } }).quietClients).toBe(0);
    expect(build({ facts: { profiles: [longAgo] } }).quietClients).toBe(1);
  });

  it('частка «тихих» — від фільтрованої множини (2 з 3)', () => {
    const quiet = profile({ createdAt: daysAgo(QUIET_DAYS + 5) });
    const active = profile({ visits: 1, lastVisitAt: daysAgo(2), lastVisitLocation: 'loc-1' });
    expect(build({ facts: { profiles: [quiet, active, quiet] } }).quietShare).toBe(0.6667);
  });
});

describe('buildClientListSummary (T-4606b) — розподіли', () => {
  it('лояльність: 0 / 1–5 / 6 (безкоштовний візит) / 7+', () => {
    const summary = build({
      facts: {
        profiles: [
          profile({ loyaltyVisits: 0 }),
          profile({ loyaltyVisits: 1 }),
          profile({ loyaltyVisits: 5 }),
          profile({ loyaltyVisits: 6 }),
          profile({ loyaltyVisits: 7 }),
          profile({ loyaltyVisits: 12 }),
        ],
      },
    });
    expect(summary.loyalty).toEqual({ none: 1, progress: 2, freeVisit: 1, cycle: 2 });
  });

  it('локації — за місцем останнього візиту, спадно за кількістю, без візитів — окремо', () => {
    const at = (locationId: string) =>
      profile({ visits: 1, lastVisitAt: daysAgo(1), lastVisitLocation: locationId });
    const summary = build({
      facts: { profiles: [at('loc-2'), at('loc-1'), at('loc-1'), profile()] },
    });
    expect(summary.locations).toEqual({
      byLocation: [
        { locationId: 'loc-1', count: 2 },
        { locationId: 'loc-2', count: 1 },
      ],
      noVisit: 1,
    });
  });

  it('повторні — клієнти з двома і більше візитами за всі часи', () => {
    const facts = {
      profiles: [
        profile({ visits: 2 }),
        profile({ visits: 1 }),
        profile({ visits: 5 }),
        profile({ visits: 0 }),
      ],
    };
    expect(build({ facts }).repeatShare).toBe(0.5);
  });
});
