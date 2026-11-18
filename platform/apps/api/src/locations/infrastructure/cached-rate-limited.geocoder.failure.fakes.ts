// Специфікація failure-handling декоратора CachedRateLimitedGeocoder:
// надгробок після серії збоїв, скидання лічильника, спільні сховища.

import { CachedRateLimitedGeocoder } from './cached-rate-limited.geocoder';
import { LocalGeocoderCacheStore, LocalGeocoderRateLimitStore, LocalGeocoderTombstoneStore } from './local-geocoder-stores';
import { DEFAULT_GEOCODER_SETTINGS, type GeocoderSettings } from '../domain/geocoder-settings';
import type { CityInfo, Geocoder } from '../domain/ports';
import type {
  GeocoderCacheStore,
  GeocoderRateLimitStore,
  GeocoderTombstoneStore,
} from '../domain/geocoder-stores';

export class StubGeocoder implements Geocoder {
  calls: Array<[number, number]> = [];
  constructor(
    private readonly result: CityInfo | null = { city: 'Київ' },
    private readonly fail = false
  ) {}
  async reverseGeocode(lat: number, lng: number): Promise<CityInfo | null> {
    this.calls.push([lat, lng]);
    if (this.fail) throw new Error('provider down');
    return this.result;
  }
}

interface SharedStores {
  cache: GeocoderCacheStore;
  rateLimit: GeocoderRateLimitStore;
  tombstone: GeocoderTombstoneStore;
}

export const T0 = 1_700_000_000_000;

export function geocoderFor(inner: Geocoder, stores: SharedStores, clock: () => number) {
  const current = {
    ...DEFAULT_GEOCODER_SETTINGS,
    rateLimit: { max: 100, windowMs: 1000 },
  } as GeocoderSettings;
  return new CachedRateLimitedGeocoder({
    inner,
    cache: stores.cache,
    rateLimit: stores.rateLimit,
    tombstone: stores.tombstone,
    settings: () => current,
    now: clock,
  });
}

export function freshStores(): SharedStores {
  return {
    cache: new LocalGeocoderCacheStore(),
    rateLimit: new LocalGeocoderRateLimitStore(),
    tombstone: new LocalGeocoderTombstoneStore(),
  };
}
