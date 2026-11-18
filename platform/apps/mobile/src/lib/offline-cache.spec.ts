import {
  loadWithCache,
  refreshAndStore,
  readCache,
  writeCache,
  isFresh,
  decodeEntry,
  singleFlight,
  CACHE_TTL_MS,
} from './offline-cache';
import { memoryStorage } from './cache-storage';

const T0 = 1_700_000_000_000;
const job = <T>(
  storage = memoryStorage(),
  fetcher: () => Promise<T> = async () => [] as unknown as T
) => ({
  storage,
  key: 'locations',
  fetcher,
  now: T0,
});

describe('offline-cache (T-4429)', () => {
  it('перший запуск тягне мережу і кладе в кеш', async () => {
    const fetcher = jest.fn(async () => ['fresh']);
    const storage = memoryStorage();

    const result = await loadWithCache({ ...job(storage, fetcher) });

    expect(result).toEqual({ data: ['fresh'], stale: false });
    expect(await readCache({ ...job(storage), now: T0 })).toEqual({
      data: ['fresh'],
      stale: false,
    });
  });

  it('свіже з кешу віддає без мережі (старт не дублює запит)', async () => {
    const storage = memoryStorage();
    await writeCache({ storage, key: 'services', now: T0 }, [1, 2, 3]);
    const fetcher = jest.fn(async () => [9]);

    const result = await loadWithCache({ storage, key: 'services', fetcher, now: T0 + 1000 });

    expect(result).toEqual({ data: [1, 2, 3], stale: false });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('TTL: після терміну кеш зволожується мережею', async () => {
    const storage = memoryStorage();
    await writeCache({ storage, key: 'services', now: T0 }, ['old']);
    const fetcher = jest.fn(async () => ['new']);
    const later = T0 + CACHE_TTL_MS + 1;

    const result = await loadWithCache({ storage, key: 'services', fetcher, now: later });

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ data: ['new'], stale: false });
    expect(await readCache({ storage, key: 'services', now: later })).toEqual({
      data: ['new'],
      stale: false,
    });
  });

  it('офлайн з кешем: «застарілі» дані, не помилка', async () => {
    const storage = memoryStorage();
    await writeCache({ storage, key: 'schedule', now: T0 }, ['slot-1']);
    const fetcher = jest.fn(async () => {
      throw new Error('network down');
    });

    const result = await loadWithCache({
      storage,
      key: 'schedule',
      fetcher,
      now: T0 + CACHE_TTL_MS + 1,
    });

    expect(result).toEqual({ data: ['slot-1'], stale: true });
  });

  it('офлайн без кешу: помилка нагору (порожній екран)', async () => {
    const fetcher = jest.fn(async () => {
      throw new Error('network down');
    });

    await expect(loadWithCache(job(memoryStorage(), fetcher))).rejects.toThrow('network down');
  });

  it('refreshAndStore кладе свіже і знімає позначку', async () => {
    const result = await refreshAndStore(job(memoryStorage(), async () => ['slot-2']));
    expect(result).toEqual({ data: ['slot-2'], stale: false });
  });

  it('singleFlight: два одночасні виклики — один запит, далі новий', async () => {
    let calls = 0;
    const run = async () => ++calls;

    const [a, b] = await Promise.all([
      singleFlight('startup:locations', run),
      singleFlight('startup:locations', run),
    ]);
    expect(calls).toBe(1);
    expect([a, b]).toEqual([1, 1]);

    await singleFlight('startup:locations', run);
    expect(calls).toBe(2);
  });

  it('decodeEntry відкидає сміття, isFresh: межа TTL — застаріле', () => {
    expect(decodeEntry(null)).toBeNull();
    expect(decodeEntry('not json')).toBeNull();
    expect(decodeEntry('{"data":[]}')).toBeNull();
    expect(decodeEntry('{"data":[],"storedAt":5}')).toEqual({ data: [], storedAt: 5 });
    expect(isFresh({ data: null, storedAt: T0 }, T0 + CACHE_TTL_MS - 1)).toBe(true);
    expect(isFresh({ data: null, storedAt: T0 }, T0 + CACHE_TTL_MS)).toBe(false);
  });
});
