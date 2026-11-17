// Юніт-тести зведення в read-моделі списку (T-4606b): `summary.total` — той
// самий `total`, що й таблиця (той самий `where`), період звужує ЛИШЕ вікно,
// порожній фільтр не тягне агрегати, а метрики рахує чиста функція
// (client-list-summary.spec.ts). Валідація — admin-client-list.spec.ts.
import { NOW, DAY_MS, facts, profile, setup } from './admin-client-list.fixtures';

describe('AdminClientList (T-4606b) — зведення по фільтру', () => {
  it('summary.total — той самий total, що й таблиця, і той самий `where`', async () => {
    const rows = [profile('a')];
    const { list, reader } = setup({ rows, all: rows });
    reader.count.mockResolvedValue(9);
    const result = await list.handle({ search: 'Олег' });
    expect(result.total).toBe(9);
    expect(result.summary.total).toBe(9);
    // Сторінка і зведення рахують ОДИН фільтр — інакше цифри розійдуться.
    expect(reader.summary.mock.calls[0]?.[0]).toBe(reader.count.mock.calls[0]?.[0]);
  });

  it('period за замовчуванням 30d; вікно рахує інжектований годинник', async () => {
    const rows = [profile('a')];
    const { list, reader } = setup({ rows, all: rows });
    await list.handle({});
    const window = reader.summary.mock.calls[0]?.[1];
    expect(window?.to).toEqual(NOW);
    expect(window?.from).toEqual(new Date(NOW.getTime() - 30 * DAY_MS));
  });

  it('period=7d звужує ЛИШЕ вікно: сторінка й ліміти не змінюються', async () => {
    const rows = [profile('a')];
    const { list, reader } = setup({ rows, all: rows });
    const result = await list.handle({ period: '7d' });
    expect(reader.summary.mock.calls[0]?.[1]?.from).toEqual(new Date(NOW.getTime() - 7 * DAY_MS));
    expect(reader.page).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
      limit: 20,
      offset: 0,
    });
    expect(result.summary.period).toBe('7d');
    expect(result.items).toHaveLength(1);
  });

  it('фільтр без клієнтів (total=0) — зведення нульове, без зайвих запитів агрегатів', async () => {
    const { list, reader } = setup({ rows: [], all: [] });
    reader.count.mockResolvedValue(0);
    const result = await list.handle({ loyaltyStatus: 'inactive' });
    expect(result.summary).toMatchObject({
      total: 0,
      avgTicket: 0,
      noShowRate: 0,
      quietShare: 0,
      repeatShare: 0,
    });
    expect(reader.summary).not.toHaveBeenCalled();
  });

  it('факти зведення доїжджають до відповіді (метрики рахує чиста функція)', async () => {
    const rows = [profile('a'), profile('b')];
    const { list } = setup({
      rows,
      all: rows,
      facts: facts({
        profiles: [
          // prettier-ignore
          { createdAt: new Date('2026-10-09T00:00:00.000Z'), loyaltyVisits: 6, visits: 2,
            lastVisitAt: new Date('2026-10-08T00:00:00.000Z'), lastVisitLocation: 'loc-1' },
          // prettier-ignore
          { createdAt: new Date('2026-01-01T00:00:00.000Z'), loyaltyVisits: 0, visits: 0,
            lastVisitAt: null, lastVisitLocation: null },
        ],
        window: [
          { status: 'completed', count: 2, revenue: 800 },
          { status: 'no_show', count: 1, revenue: 0 },
        ],
      }),
    });
    const result = await list.handle({});
    expect(result.summary).toMatchObject({
      total: 2,
      newClients: 1,
      visits: 3,
      revenue: 800,
      avgTicket: 400,
      noShowRate: 0.3333,
      quietClients: 1,
      quietShare: 0.5,
      repeatShare: 0.5,
      loyalty: { none: 1, progress: 0, freeVisit: 1, cycle: 0 },
      locations: { byLocation: [{ locationId: 'loc-1', count: 1 }], noVisit: 1 },
    });
  });
});
