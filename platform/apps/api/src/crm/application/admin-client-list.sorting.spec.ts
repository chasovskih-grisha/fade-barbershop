// Юніт-тести сортування й пагінації списку клієнтів (T-4606a): колонки профілю
// віддає СУБД, visits/lastVisit групуються в пам'яті (null — наприкінці), і
// статистика читається ОДНИМ викликом на сторінку (без N+1). Валідація —
// admin-client-list.spec.ts, зведення — admin-client-list.summary.spec.ts.
import { profile, setup } from './admin-client-list.fixtures';

describe('AdminClientList (T-4606a) — сортування й пагінація', () => {
  it('колонки профілю — порядок передається в порт (СУБД сортує)', async () => {
    const { list, reader } = setup();
    await list.handle({ sort: 'vip', order: 'desc' });
    expect(reader.page).toHaveBeenCalledWith(
      expect.anything(),
      { key: 'vip', dir: 'desc' },
      {
        limit: 20,
        offset: 0,
      }
    );
    expect(reader.keys).not.toHaveBeenCalled();
  });

  it('sort=visits — групується в пам’яті по статистиці, за замовчуванням asc', async () => {
    const all = [profile('a'), profile('b'), profile('c')];
    const { list, reader } = setup({
      all,
      stats: [
        { clientId: 'a', visits: 3, lastVisit: null },
        { clientId: 'u-b', visits: 7, lastVisit: new Date('2026-10-01T10:00:00Z') },
        { clientId: 'c', visits: 0, lastVisit: null },
      ],
    });
    const result = await list.handle({ sort: 'visits' });
    expect(reader.page).not.toHaveBeenCalled();
    expect(result.items.map((i) => i.id)).toEqual(['c', 'a', 'b']);
    expect(result.items[1]).toMatchObject({ visits: 3, lastVisit: null });
    expect(result.total).toBe(3);
    expect(result.pages).toBe(1);
  });

  it('sort=visits&order=desc — спадно; рядок без візитів лишається останнім', async () => {
    const all = [profile('a'), profile('b')];
    const { list } = setup({
      all,
      stats: [
        { clientId: 'a', visits: 5, lastVisit: null },
        { clientId: 'u-b', visits: 0, lastVisit: null },
      ],
    });
    const result = await list.handle({ sort: 'visits', order: 'desc' });
    expect(result.items.map((i) => i.id)).toEqual(['a', 'b']);
  });

  it('sort=lastVisit — новіші першими; lastVisit у DTO — ISO', async () => {
    const all = [profile('a'), profile('b')];
    const { list } = setup({
      all,
      stats: [
        { clientId: 'a', visits: 1, lastVisit: new Date('2026-09-01T09:00:00Z') },
        { clientId: 'u-b', visits: 2, lastVisit: new Date('2026-10-01T09:00:00Z') },
      ],
    });
    const result = await list.handle({ sort: 'lastVisit', order: 'desc' });
    expect(result.items.map((i) => i.id)).toEqual(['b', 'a']);
    expect(result.items[0]?.lastVisit).toBe('2026-10-01T09:00:00.000Z');
  });

  it('пагінація: page=2 → offset=perPage; pages = ceil(total/perPage)', async () => {
    const { list, reader } = setup({ rows: [profile('x')], all: [profile('x')] });
    reader.count.mockResolvedValue(45);
    const result = await list.handle({ page: '2', perPage: '20' });
    expect(reader.page).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
      limit: 20,
      offset: 20,
    });
    expect(result).toMatchObject({ total: 45, page: 2, pages: 3 });
    expect(result.items).toHaveLength(1);
  });

  it('статистика — один виклик visitStats на сторінку (без N+1)', async () => {
    const all = [profile('a'), profile('b'), profile('c')];
    const { list, reader } = setup({ rows: all, all });
    await list.handle({});
    expect(reader.visitStats).toHaveBeenCalledTimes(1);
    expect(reader.visitStats).toHaveBeenCalledWith(['a', 'u-a', 'b', 'u-b', 'c', 'u-c']);
  });
});
