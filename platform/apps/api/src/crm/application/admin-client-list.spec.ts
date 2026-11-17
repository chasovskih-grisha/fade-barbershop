// Юніт-тести валідації й фільтрів read-моделі списку клієнтів (T-4606a):
// неприпустимі sort/order/perPage/page/loyaltyStatus/period → 400,
// нормалізація телефону до E.164, порожній фільтр локації без зайвих запитів.
// Сортування й пагінація — admin-client-list.sorting.spec.ts, зведення —
// admin-client-list.summary.spec.ts.
import { AdminClientList } from './admin-client-list';
import { CLOCK, setup } from './admin-client-list.fixtures';

describe('AdminClientList (T-4606a) — валідація', () => {
  const expectInvalid = async (query: Record<string, string>, detail: string) =>
    expect(new AdminClientList({} as never, CLOCK).handle(query)).rejects.toThrow(detail);

  it('неприпустимі sort/order/perPage/page/loyaltyStatus/period → 400', async () => {
    await expectInvalid({ sort: 'ltv' }, 'sort "ltv"');
    await expectInvalid({ order: 'up' }, 'order "up"');
    await expectInvalid({ perPage: '101' }, 'perPage must be 1..100');
    await expectInvalid({ perPage: '0' }, 'perPage must be 1..100');
    await expectInvalid({ perPage: 'abc' }, 'perPage must be an integer');
    await expectInvalid({ page: '0' }, 'page must be >= 1');
    await expectInvalid({ page: '-1' }, 'page must be an integer');
    await expectInvalid({ loyaltyStatus: 'vip' }, 'loyaltyStatus "vip"');
    await expectInvalid({ period: '1d' }, 'period "1d"');
    await expectInvalid({ period: '30' }, 'period "30"');
  });

  it('межі: perPage=100 ок; без параметрів — дефолти name/asc/page=1/perPage=20', async () => {
    const { list, reader } = setup();
    await list.handle({ perPage: '100' });
    expect(reader.page).toHaveBeenCalledWith(
      expect.anything(),
      { key: 'name', dir: 'asc' },
      {
        limit: 100,
        offset: 0,
      }
    );
    const second = setup();
    await second.list.handle({});
    expect(second.reader.page).toHaveBeenCalledWith(
      expect.anything(),
      { key: 'name', dir: 'asc' },
      {
        limit: 20,
        offset: 0,
      }
    );
  });

  it('пошук: ім’я — insensitive, телефон — E.164 (067… → +380…), фрагмент — цифрами', async () => {
    const { list, reader } = setup();
    await list.handle({ search: 'Олексій' });
    expect(reader.count).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'Олексій', phoneSearch: null })
    );
    await list.handle({ search: '067 123 45 67' });
    expect(reader.count).toHaveBeenLastCalledWith(
      expect.objectContaining({ phoneSearch: '+380671234567' })
    );
    await list.handle({ search: '6712345' });
    expect(reader.count).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: '6712345', phoneSearch: '6712345' })
    );
  });

  it('фільтр locationId → port locationVisitors; порожній список без запитів далі', async () => {
    const { list, reader } = setup();
    reader.locationVisitors.mockResolvedValue([]);
    reader.count.mockResolvedValue(0);
    const result = await list.handle({ locationId: 'loc-1' });
    expect(reader.locationVisitors).toHaveBeenCalledWith('loc-1');
    expect(result).toMatchObject({ items: [], total: 0, page: 1, pages: 0 });
    // Зведення теж нульове — сторінка порожня, агрегати не читаються.
    expect(result.summary).toMatchObject({ total: 0, visits: 0, revenue: 0, quietClients: 0 });
    expect(reader.page).not.toHaveBeenCalled();
  });

  it('loyaltyStatus активний/неактивний іде в where порту', async () => {
    const { list, reader } = setup();
    await list.handle({ loyaltyStatus: 'inactive' });
    expect(reader.count).toHaveBeenLastCalledWith(
      expect.objectContaining({ loyaltyStatus: 'inactive' })
    );
  });
});
