// Юніт-тести зведення списку клієнтів (T-4606b): вікно періоду, контракт
// `summary.total === total` і нульові знаменники (порожній фільтр, немає
// завершених візитів). Розподіли — client-list-summary.distributions.spec.ts.
import { summaryWindow } from './client-list-summary';
import { NOW, build, daysAgo, profile } from './client-list-summary.fixtures';

describe('summaryWindow (T-4606b) — період як вікно', () => {
  it('7d/30d/90d — від «зараз» назад на відповідну кількість днів', () => {
    expect(summaryWindow('7d', NOW).from).toEqual(daysAgo(7));
    expect(summaryWindow('30d', NOW).from).toEqual(daysAgo(30));
    expect(summaryWindow('90d', NOW).from).toEqual(daysAgo(90));
    expect(summaryWindow('90d', NOW).to).toEqual(NOW);
  });

  it('вікно не мутує «зараз» — межі лишаються копіями', () => {
    const window = summaryWindow('7d', NOW);
    window.from.setFullYear(1999);
    expect(NOW.toISOString()).toBe('2026-10-10T00:00:00.000Z');
  });
});

describe('buildClientListSummary (T-4606b) — контракт і порожній фільтр', () => {
  it('порожній фільтр: нулі замість NaN (ділення на нуль)', () => {
    expect(build({ total: 0 })).toMatchObject({
      total: 0,
      period: '30d',
      newClients: 0,
      visits: 0,
      revenue: 0,
      avgTicket: 0,
      noShowRate: 0,
      quietClients: 0,
      quietShare: 0,
      repeatShare: 0,
      loyalty: { none: 0, progress: 0, freeVisit: 0, cycle: 0 },
      locations: { byLocation: [], noVisit: 0 },
    });
  });

  it('`total` — той, що віддає таблиця, а не довжина фактів', () => {
    expect(build({ total: 7, facts: { profiles: [profile()] } }).total).toBe(7);
  });

  it('період і межі вікна у ISO — UI показує, що пораховано', () => {
    const summary = build({ period: '90d' });
    expect(summary.period).toBe('90d');
    expect(summary.from).toBe(daysAgo(90).toISOString());
    expect(summary.to).toBe(NOW.toISOString());
  });

  it('нові клієнти — реєстрація у вікні: 90d включає старших, 7d — ні', () => {
    const facts = { profiles: [profile({ createdAt: daysAgo(20) })] };
    expect(build({ period: '90d', facts }).newClients).toBe(1);
    expect(build({ period: '7d', facts }).newClients).toBe(0);
  });
});

describe('buildClientListSummary (T-4606b) — візити, виручка, ставки', () => {
  const window = [
    { status: 'completed', count: 3, revenue: 1300 },
    { status: 'no_show', count: 1, revenue: 0 },
    { status: 'cancelled', count: 2, revenue: 0 },
  ];

  it('візити — усі статуси (як лічильник у рядку таблиці), виручка — лише завершені', () => {
    const summary = build({ facts: { window } });
    expect(summary.visits).toBe(6);
    expect(summary.revenue).toBe(1300);
  });

  it('середній чек = виручка / завершені, округлено до гривні', () => {
    expect(build({ facts: { window } }).avgTicket).toBe(433);
    expect(
      build({ facts: { window: [{ status: 'completed', count: 4, revenue: 1000 }] } }).avgTicket
    ).toBe(250);
  });

  it('середній чек — 0, коли завершених немає (нульовий знаменник)', () => {
    const summary = build({ facts: { window: [{ status: 'no_show', count: 3, revenue: 0 }] } });
    expect(summary.avgTicket).toBe(0);
    expect(summary.revenue).toBe(0);
  });

  it('no-show rate = no-show / усі заброньовані (скасовані теж у знаменнику)', () => {
    // 1 no-show із 3 completed + 1 no-show + 2 cancelled = 1/6.
    expect(build({ facts: { window } }).noShowRate).toBe(0.1667);
    expect(
      build({ facts: { window: [{ status: 'no_show', count: 2, revenue: 0 }] } }).noShowRate
    ).toBe(1);
    // 2/8 — рівна частка: округлення не маскує формулу.
    const even = [
      { status: 'no_show', count: 2, revenue: 0 },
      { status: 'booked', count: 6, revenue: 0 },
    ];
    expect(build({ facts: { window: even } }).noShowRate).toBe(0.25);
  });

  it('нуль візитів у вікні — ставки 0, не NaN', () => {
    const summary = build({ facts: { window: [{ status: null, count: 0, revenue: 0 }] } });
    expect(summary.noShowRate).toBe(0);
    expect(summary.avgTicket).toBe(0);
  });
});
