// Специфікація Redis-сховищ геокодера (ADR 0050) на скриптованому фейку
// (redis-geocoder.fake): скоуплення ключів, кеш PX-TTL, ковзне вікно, надгробок,
// fail-open без клієнта (get→null, tryAcquire→true, isTombstoned→false).
import {
  RedisGeocoderCacheStore,
  RedisGeocoderRateLimitStore,
  RedisGeocoderTombstoneStore,
  scopedKey,
} from './redis-geocoder-stores';
import { FakeRedis } from './redis-geocoder.fake';

const ADAPTER = 'nominatim';
const T0 = 1_700_000_000_000;

/** Слот лімітів з фіксованим вікном. */
const slot = (max = 2, windowMs = 1000, nowMs = T0) => ({ key: 'global', max, windowMs, nowMs });
/** Збій надгробка: n-й підряд. */
// prettier-ignore
const failure = (n: number, threshold = 3) => ({ key: 'global', nowMs: T0 + n, threshold, durationMs: 60_000 });

describe('RedisGeocoderCacheStore', () => {
  it('set/get повертає той самий CachedCity за скоупленим ключем', async () => {
    const store = new RedisGeocoderCacheStore(ADAPTER, Promise.resolve(new FakeRedis()));
    const value = { city: 'Київ', expiresAt: T0 + 1000 };
    await store.set('50.450|30.523', value, 60_000);
    expect(await store.get('50.450|30.523')).toEqual(value);
  });

  it('запис живе не довше TTL: після закінчення — промах (PX)', async () => {
    const redis = new FakeRedis();
    const store = new RedisGeocoderCacheStore(ADAPTER, Promise.resolve(redis));
    await store.set('49.839|24.029', { city: 'Львів', expiresAt: T0 + 500 }, 500);
    redis.advance(501);
    expect(await store.get('49.839|24.029')).toBeNull();
  });

  it('без клієнта або при помилці Redis — деградація: get→null, set мовчки', async () => {
    const store = new RedisGeocoderCacheStore(ADAPTER, Promise.resolve(null));
    await store.set('50.450|30.523', { city: 'Київ', expiresAt: 1 }, 1000);
    await expect(store.get('50.450|30.523')).resolves.toBeNull();
    const broken = new RedisGeocoderCacheStore(ADAPTER, Promise.reject(new Error('down')) as never);
    await expect(broken.get('k')).resolves.toBeNull();
  });

  it('scopedKey скоупить ключі на адаптера (окремі бюджети)', () => {
    expect(scopedKey('google', 'cache', 'k')).toBe('geocoder:google:cache:k');
  });
});

describe('RedisGeocoderRateLimitStore', () => {
  it('дозволяє рівно max викликів у вікні, далі відмовляє; вікно ковзне', async () => {
    const store = new RedisGeocoderRateLimitStore(ADAPTER, Promise.resolve(new FakeRedis()));
    expect(await store.tryAcquire(slot())).toBe(true);
    expect(await store.tryAcquire(slot())).toBe(true);
    expect(await store.tryAcquire(slot())).toBe(false);
    expect(await store.tryAcquire(slot(2, 1000, T0 + 1001))).toBe(true); // вікно вийшло
  });

  it('fail-open: без клієнта слот завжди є (дзвінок дозволено)', async () => {
    const store = new RedisGeocoderRateLimitStore(ADAPTER, Promise.resolve(null));
    expect(await store.tryAcquire(slot(1))).toBe(true);
    expect(await store.tryAcquire(slot(1))).toBe(true);
  });
});

describe('RedisGeocoderTombstoneStore', () => {
  it('recordSuccess скидає серію збоїв', async () => {
    const store = new RedisGeocoderTombstoneStore(ADAPTER, Promise.resolve(new FakeRedis()));
    await store.recordFailure(failure(0));
    await store.recordFailure(failure(1));
    await store.recordSuccess('global');
    await store.recordFailure(failure(2));
    expect(await store.isTombstoned('global', T0 + 3)).toBe(false);
  });

  it('після threshold збоїв — надгробок; він скінчується після durationMs', async () => {
    const redis = new FakeRedis();
    const store = new RedisGeocoderTombstoneStore(ADAPTER, Promise.resolve(redis));
    await store.recordFailure(failure(0));
    await store.recordFailure(failure(1));
    expect(await store.isTombstoned('global', T0)).toBe(false);
    await store.recordFailure(failure(2)); // третій підряд → надгробок
    expect(await store.isTombstoned('global', T0 + 59_999)).toBe(true);
    redis.advance(60_001);
    expect(await store.isTombstoned('global', T0 + 60_001)).toBe(false);
  });

  it('fail-open: без клієнта надгробка немає', async () => {
    const store = new RedisGeocoderTombstoneStore(ADAPTER, Promise.resolve(null));
    await store.recordFailure(failure(0, 1));
    expect(await store.isTombstoned('global', 1)).toBe(false);
  });
});
