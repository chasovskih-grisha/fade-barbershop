// Специфікація rate limit декоратора CachedRateLimitedGeocoder:
// максмум дзвінків у ковзному вікні. Годинник фіксований.

import { CachedRateLimitedGeocoder } from './cached-rate-limited.geocoder';
import {
  LocalGeocoderCacheStore,
  LocalGeocoderRateLimitStore,
  LocalGeocoderTombstoneStore,
} from './local-geocoder-stores';
import { DEFAULT_GEOCODER_SETTINGS, type GeocoderSettings } from '../domain/geocoder-settings';
import type { CityInfo, Geocoder } from '../domain/ports';

class StubGeocoder implements Geocoder {
  calls: Array<[number, number]> = [];
  constructor(private readonly result: CityInfo | null = { city: 'Київ' }) {}
  async reverseGeocode(lat: number, lng: number): Promise<CityInfo | null> {
    this.calls.push([lat, lng]);
    return this.result;
  }
}

const T0 = 1_700_000_000_000;

interface Harness {
  geocoder: CachedRateLimitedGeocoder;
  inner: StubGeocoder;
  tick: (ms: number) => void;
}

function setup(settings: Partial<GeocoderSettings> = {}): Harness {
  const inner = new StubGeocoder();
  const current = { ...DEFAULT_GEOCODER_SETTINGS, ...settings } as GeocoderSettings;
  let t = T0;
  const geocoder = new CachedRateLimitedGeocoder({
    inner,
    cache: new LocalGeocoderCacheStore(),
    rateLimit: new LocalGeocoderRateLimitStore(),
    tombstone: new LocalGeocoderTombstoneStore(),
    settings: () => current,
    now: () => t,
  });
  return {
    geocoder,
    inner,
    tick: (ms: number) => {
      t += ms;
    },
  };
}

describe('CachedRateLimitedGeocoder rate limit', () => {
  it('rate limit: після max дзвінків у вікні повертає null без виклику провайдера', async () => {
    const { geocoder, inner } = setup({ rateLimit: { max: 2, windowMs: 1000 } });
    await geocoder.reverseGeocode(50.45, 30.52);
    await geocoder.reverseGeocode(50.46, 30.53);
    const result = await geocoder.reverseGeocode(50.47, 30.54);
    expect(result).toBeNull();
    expect(inner.calls).toHaveLength(2);
  });

  it('вікно ковзне: після windowMs ліміт відновлюється', async () => {
    const { geocoder, inner, tick } = setup({ rateLimit: { max: 1, windowMs: 1000 } });
    await geocoder.reverseGeocode(50.45, 30.52);
    tick(1001);
    await geocoder.reverseGeocode(50.46, 30.53);
    expect(inner.calls).toHaveLength(2);
  });
});
