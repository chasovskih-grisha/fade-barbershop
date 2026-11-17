// Специфікація GeocoderStoresFactory: вибір режиму за FADE_GEOCODER_STORE
// і опис режиму для /health (describe). Redis-гілку клієнта мокаємо —
// публічний контракт getRedisClient перевіряють спеки redis-сховищ.

import { GeocoderStoresFactory } from './geocoder-stores.factory';
import * as redisStores from './redis-geocoder-stores';

describe('GeocoderStoresFactory', () => {
  const FACTORY = 'FADE_GEOCODER_STORE';
  const REDIS_URL = 'FADE_REDIS_URL';

  afterEach(() => {
    delete process.env[FACTORY];
    delete process.env[REDIS_URL];
    jest.restoreAllMocks();
  });

  it('за замовчуванням — local: усі три порти in-process', () => {
    const set = new GeocoderStoresFactory().forAdapter('nominatim');
    expect(set.mode).toBe('local');
    expect(set.cache).toBeDefined();
    expect(set.rateLimit).toBeDefined();
    expect(set.tombstone).toBeDefined();
  });

  it('FADE_GEOCODER_STORE=redis збирає Redis-сховища трьох портів', () => {
    process.env[FACTORY] = 'redis';
    process.env[REDIS_URL] = 'redis://localhost:16379';
    const fake = { get: async () => null } as unknown as redisStores.RedisLike;
    jest.spyOn(redisStores, 'getRedisClient').mockResolvedValue(fake);

    const set = new GeocoderStoresFactory().forAdapter('nominatim');
    expect(set.mode).toBe('redis');
  });

  it('describe: local — configured=effective=local, redisUnavailable=false', async () => {
    const d = await new GeocoderStoresFactory().describe('nominatim');
    expect(d).toEqual({
      adapter: 'nominatim',
      configured: 'local',
      effective: 'local',
      redisUnavailable: false,
    });
  });

  it('describe: redis з доступним клієнтом — effective=redis', async () => {
    process.env[FACTORY] = 'redis';
    process.env[REDIS_URL] = 'redis://localhost:16379';
    jest
      .spyOn(redisStores, 'getRedisClient')
      .mockResolvedValue({} as unknown as redisStores.RedisLike);

    const d = await new GeocoderStoresFactory().describe('nominatim');
    expect(d).toEqual({
      adapter: 'nominatim',
      configured: 'redis',
      effective: 'redis',
      redisUnavailable: false,
    });
  });

  it('describe: redis без URL/пакета — fail-open, effective=local і прапорець', async () => {
    process.env[FACTORY] = 'redis';
    jest.spyOn(redisStores, 'getRedisClient').mockResolvedValue(null);

    const d = await new GeocoderStoresFactory().describe('nominatim');
    expect(d).toEqual({
      adapter: 'nominatim',
      configured: 'redis',
      effective: 'local',
      redisUnavailable: true,
    });
  });
});
