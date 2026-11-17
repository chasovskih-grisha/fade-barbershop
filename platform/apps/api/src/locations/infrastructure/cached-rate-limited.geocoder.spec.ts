// Специфікація декоратора CachedRateLimitedGeocoder: кеш (TTL, коалесинг
// приблизних координат). Годинник фіксований — тести детерміновані.
// Сховища — через порти (ADR 0050).

import { CachedRateLimitedGeocoder, cacheKey } from './cached-rate-limited.geocoder';
// prettier-ignore
import { LocalGeocoderCacheStore, LocalGeocoderRateLimitStore, LocalGeocoderTombstoneStore } from './local-geocoder-stores';
import { DEFAULT_GEOCODER_SETTINGS, type GeocoderSettings } from '../domain/geocoder-settings';
import type { CityInfo, Geocoder } from '../domain/ports';

class StubGeocoder implements Geocoder {
  calls: Array<[number, number]> = [];
  // prettier-ignore
  constructor(private readonly result: CityInfo | null = { city: 'Київ' }, private readonly fail = false) {}
  async reverseGeocode(lat: number, lng: number): Promise<CityInfo | null> {
    this.calls.push([lat, lng]);
    if (this.fail) throw new Error('provider down');
    return this.result;
  }
}

const T0 = 1_700_000_000_000;

/** Піднятий ліміт: у тестах кешу він не має блокувати. */
const NO_LIMIT = { rateLimit: { max: 100, windowMs: 1000 } };

interface Harness {
  geocoder: CachedRateLimitedGeocoder;
  inner: StubGeocoder;
  tick: (ms: number) => void;
}

function setup(
  opts: { result?: CityInfo | null; settings?: Partial<GeocoderSettings> } = {}
): Harness {
  const inner = new StubGeocoder(opts.result ?? { city: 'Київ' });
  const current = { ...DEFAULT_GEOCODER_SETTINGS, ...opts.settings } as GeocoderSettings;
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

describe('CachedRateLimitedGeocoder кеш', () => {
  it('повертає місто провайдера і кешує відповідь (другий виклик без дзвінка)', async () => {
    const { geocoder, inner } = setup();
    expect(await geocoder.reverseGeocode(50.4501, 30.5234)).toEqual({ city: 'Київ' });
    expect(await geocoder.reverseGeocode(50.4501, 30.5234)).toEqual({ city: 'Київ' });
    expect(inner.calls).toHaveLength(1);
  });

  it('коалесить координати в межах ~110 м (3 знаки) в один кеш-ключ', async () => {
    const { geocoder, inner } = setup({ settings: NO_LIMIT });
    await geocoder.reverseGeocode(50.45011, 30.52341);
    await geocoder.reverseGeocode(50.45014, 30.52344);
    expect(inner.calls).toHaveLength(1);
    expect(cacheKey(50.45011, 30.52341)).toBe(cacheKey(50.45014, 30.52344));
  });

  it('після закінчення TTL кешу йде до провайдера знову', async () => {
    // prettier-ignore
    const { geocoder, inner, tick } = setup({ settings: { cacheTtlMs: 1000, ...NO_LIMIT } });
    await geocoder.reverseGeocode(50.45, 30.52);
    tick(1001);
    await geocoder.reverseGeocode(50.45, 30.52);
    expect(inner.calls).toHaveLength(2);
  });

  it('cacheTtlMs=0 означає «не кешувати» (ліміт піднято — не він блокує)', async () => {
    // prettier-ignore
    const { geocoder, inner } = setup({ settings: { cacheTtlMs: 0, ...NO_LIMIT } });
    await geocoder.reverseGeocode(50.45, 30.52);
    await geocoder.reverseGeocode(50.45, 30.52);
    expect(inner.calls).toHaveLength(2);
  });

  it('null відповідь провайдера НЕ вважається збоєм і кешується (уникаємо шторму)', async () => {
    const { geocoder, inner } = setup({ result: null, settings: NO_LIMIT });
    await geocoder.reverseGeocode(50.45, 30.52);
    await geocoder.reverseGeocode(50.45, 30.52);
    expect(inner.calls).toHaveLength(1);
  });
});
