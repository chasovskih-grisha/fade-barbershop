// Специфікація метрик CachedRateLimitedGeocoder: кеш hit/miss, ліміт, надгробок,
// збої провайдера — лічильники для /health. Годинник фіксований — детерміновано.
import { CachedRateLimitedGeocoder } from './cached-rate-limited.geocoder';
// prettier-ignore
import { LocalGeocoderCacheStore, LocalGeocoderRateLimitStore, LocalGeocoderTombstoneStore } from './local-geocoder-stores';
import { GeocoderMetrics } from './geocoder-metrics';
import { DEFAULT_GEOCODER_SETTINGS, type GeocoderSettings } from '../domain/geocoder-settings';
import type { Geocoder } from '../domain/ports';

const T0 = 1_700_000_000_000;

function setup(opts: { fail?: boolean; cacheTtlMs?: number } = {}) {
  const calls: Array<[number, number]> = [];
  const inner: Geocoder = {
    // prettier-ignore
    reverseGeocode: (lat, lng) => { calls.push([lat, lng]); return opts.fail ? Promise.reject(new Error('provider down')) : Promise.resolve({ city: 'Київ' }); },
  };
  const current = {
    ...DEFAULT_GEOCODER_SETTINGS,
    cacheTtlMs: opts.cacheTtlMs ?? DEFAULT_GEOCODER_SETTINGS.cacheTtlMs,
    // prettier-ignore
    rateLimit: { max: 1, windowMs: 1000 },
  } as GeocoderSettings;
  let t = T0;
  const metrics = new GeocoderMetrics();
  const geocoder = new CachedRateLimitedGeocoder({
    inner,
    cache: new LocalGeocoderCacheStore(),
    rateLimit: new LocalGeocoderRateLimitStore(),
    tombstone: new LocalGeocoderTombstoneStore(),
    settings: () => current,
    metrics,
    now: () => t,
  });
  // prettier-ignore
  return { calls, geocoder, metrics, tick: (ms: number) => void (t += ms) };
}

describe('CachedRateLimitedGeocoder метрики', () => {
  it('кеш: перший виклик — miss + provider_success, другий (у TTL) — hit', async () => {
    const { geocoder, calls, metrics } = setup();
    await geocoder.reverseGeocode(50.45, 30.52);
    await geocoder.reverseGeocode(50.45, 30.52);
    expect(calls).toHaveLength(1);
    expect(metrics.snapshot()).toMatchObject({
      cache_miss: 1,
      cache_hit: 1,
      provider_success: 1,
    });
  });

  it('друга координата в межах вікна лімітів — miss + rate_limit_rejected', async () => {
    const { geocoder, calls, metrics } = setup();
    await geocoder.reverseGeocode(50.45, 30.52);
    await geocoder.reverseGeocode(50.46, 30.53);
    expect(calls).toHaveLength(1);
    expect(metrics.snapshot()).toMatchObject({
      cache_miss: 2,
      rate_limit_rejected: 1,
      provider_success: 1,
    });
  });

  it('cacheTtlMs=0: обидва виклики — промахи, хітів немає', async () => {
    const { geocoder, calls, metrics, tick } = setup({ cacheTtlMs: 0 });
    await geocoder.reverseGeocode(50.45, 30.52);
    tick(1001); // нове вікно лімітів, інакше max=1 відмовить другий дзвінок
    await geocoder.reverseGeocode(50.45, 30.52);
    expect(calls).toHaveLength(2);
    expect(metrics.snapshot()).toMatchObject({ cache_miss: 2, cache_hit: 0, provider_success: 2 });
  });

  it('збій провайдера — provider_failure і null у відповідь', async () => {
    const { geocoder, metrics } = setup({ fail: true });
    await expect(geocoder.reverseGeocode(50.45, 30.52)).resolves.toBeNull();
    expect(metrics.snapshot()).toMatchObject({
      cache_miss: 1,
      provider_failure: 1,
      provider_success: 0,
    });
  });

  it('після 3 збоїв — tombstoned, після 60 с — знову збої; під надгробком лічильник збоїв росте знову', async () => {
    const { geocoder, calls, metrics, tick } = setup({ fail: true });
    for (let i = 0; i < 3; i++) {
      if (i > 0) tick(1001);
      await geocoder.reverseGeocode(50.45, 30.52 + i * 0.01);
    }
    expect(metrics.snapshot()).toMatchObject({ cache_miss: 3, provider_failure: 3 });
    await geocoder.reverseGeocode(50.99, 30.99); // під надгробком
    expect(calls).toHaveLength(3);
    expect(metrics.snapshot()).toMatchObject({ cache_miss: 4, tombstoned: 1, provider_failure: 3 });
    // Надгробок скінчився: провайдер знову викликається, provider_failure росте.
    tick(60_001);
    await geocoder.reverseGeocode(50.99, 30.99);
    expect(calls).toHaveLength(4);
    expect(metrics.snapshot()).toMatchObject({ cache_miss: 5, tombstoned: 1, provider_failure: 4 });
  });
});
