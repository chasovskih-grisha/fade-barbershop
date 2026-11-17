// Специфікація PrismaGeocoderSettings: збереження/читання налаштування,
// коротке кешування прочитань, стійкість до сміття в БД (деградація до дефолтів).

import { PrismaGeocoderSettings } from './prisma-geocoder-settings';
import { DEFAULT_GEOCODER_SETTINGS, SETTING_KEY } from '../domain/geocoder-settings';

type Row = { key: string; value: unknown };

function prismaStub(rows: Row[]) {
  const store = new Map<string, unknown>(rows.map((r) => [r.key, r.value]));
  let reads = 0;
  return {
    store,
    reads: () => reads,
    appSetting: {
      findUnique: async ({ where }: { where: { key: string } }) => {
        reads++;
        return store.has(where.key) ? { key: where.key, value: store.get(where.key) } : null;
      },
      upsert: async ({
        where,
        create,
        update,
      }: {
        where: { key: string };
        create: { key: string; value: unknown };
        update: { value: unknown };
      }) => {
        store.set(where.key, update?.value ?? create.value);
        return { key: where.key, value: store.get(where.key) };
      },
    },
  };
}

describe('PrismaGeocoderSettings (налаштування геокодування в AppSetting)', () => {
  it('без рядка в БД повертає дефолти (nominatim, 1 req/s, TTL 24 год)', async () => {
    const settings = new PrismaGeocoderSettings(prismaStub([]) as never);
    expect(await settings.get()).toEqual(DEFAULT_GEOCODER_SETTINGS);
  });

  it('валідне значення парситься: google з лімітами 5/сек і TTL 1 год', async () => {
    const settings = new PrismaGeocoderSettings(
      prismaStub([
        {
          key: SETTING_KEY,
          value: {
            provider: 'google',
            rateLimit: { max: 5, windowMs: 1000 },
            cacheTtlMs: 3_600_000,
          },
        },
      ]) as never
    );
    const value = await settings.get();
    expect(value.provider).toBe('google');
    expect(value.rateLimit).toEqual({ max: 5, windowMs: 1000 });
    expect(value.cacheTtlMs).toBe(3_600_000);
  });

  it('сміття в JSON деградує поля до дефолтів, а не кидає', async () => {
    const settings = new PrismaGeocoderSettings(
      prismaStub([
        {
          key: SETTING_KEY,
          value: { provider: 'bitcoin', rateLimit: { max: -5 }, cacheTtlMs: 'tree' },
        },
      ]) as never
    );
    const value = await settings.get();
    expect(value).toEqual(DEFAULT_GEOCODER_SETTINGS);
  });

  it('кешує прочитання на ~1 с (два get() = один запит до БД)', async () => {
    const stub = prismaStub([{ key: SETTING_KEY, value: { provider: 'google' } }]);
    const settings = new PrismaGeocoderSettings(stub as never);
    await settings.get();
    await settings.get();
    expect(stub.reads()).toBe(1);
  });

  it('set() зберігає і робить значення негайно видимим (кеш інвалідовано)', async () => {
    const stub = prismaStub([]);
    const settings = new PrismaGeocoderSettings(stub as never);
    await settings.set({ ...DEFAULT_GEOCODER_SETTINGS, provider: 'google' });
    expect((await settings.get()).provider).toBe('google');
    expect(stub.store.get(SETTING_KEY)).toMatchObject({ provider: 'google' });
  });
});
