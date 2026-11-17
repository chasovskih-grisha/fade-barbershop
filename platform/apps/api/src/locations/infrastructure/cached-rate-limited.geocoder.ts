// CachedRateLimitedGeocoder — декоратор Geocoder: TTL-кеш (координата → місто),
// ковзне вікно лімітів (Nominatim ≤1 req/s) і надгробок після серії збоїв.
// Помилка/ліміт → null (контракт Geocoder). Стан — у сховищах Map або Redis
// (ADR 0050); ліміти/TTL — GeocoderSettings на кожен виклик; лічильники — metrics.

import { Injectable } from '@nestjs/common';
import type { CityInfo, Geocoder } from '../domain/ports';
import { DEFAULT_GEOCODER_SETTINGS, type GeocoderSettings } from '../domain/geocoder-settings';
import type {
  CachedCity,
  GeocoderCacheStore,
  GeocoderRateLimitStore,
  GeocoderTombstoneStore,
} from '../domain/geocoder-stores';
import { runProbe } from './geocoder-run-probe';
import type { GeocoderMetrics } from './geocoder-metrics';
// prettier-ignore
import { CACHE_TTL_MAX_MS, GLOBAL_LIMIT_KEY, TOMBSTONE_AFTER_FAILURES, TOMBSTONE_MS, cacheKey } from './geocoder-limits';

export { cacheKey };

@Injectable()
export class CachedRateLimitedGeocoder implements Geocoder {
  private readonly inner: Geocoder;
  private readonly cache: GeocoderCacheStore;
  private readonly rateLimit: GeocoderRateLimitStore;
  private readonly tombstone: GeocoderTombstoneStore;
  private readonly settings: () => GeocoderSettings | Promise<GeocoderSettings>;
  private readonly metrics: GeocoderMetrics | null;
  private readonly now: () => number;

  constructor(options: {
    inner: Geocoder;
    cache: GeocoderCacheStore;
    rateLimit: GeocoderRateLimitStore;
    tombstone: GeocoderTombstoneStore;
    /** Живе читання налаштувань (MNG-ADM-18); sync або Promise. */
    settings?: () => GeocoderSettings | Promise<GeocoderSettings>;
    /** Лічильники кеш/ліміт/надгробок/збої — опційно. */
    metrics?: GeocoderMetrics;
    /** Тестам дозволяємо фіксувати час. */
    now?: () => number;
  }) {
    this.inner = options.inner;
    this.cache = options.cache;
    this.rateLimit = options.rateLimit;
    this.tombstone = options.tombstone;
    this.settings = options.settings ?? (() => DEFAULT_GEOCODER_SETTINGS);
    this.metrics = options.metrics ?? null;
    this.now = options.now ?? (() => Date.now());
  }

  async reverseGeocode(lat: number, lng: number): Promise<CityInfo | null> {
    const t = this.now();
    const { cacheTtlMs, rateLimit } = await this.settings();
    const key = cacheKey(lat, lng);

    const hit = await this.cache.get(key);
    if (hit && hit.expiresAt > t) {
      this.metrics?.increment('cache_hit');
      return hit.city === null ? null : { city: hit.city };
    }
    this.metrics?.increment('cache_miss');

    if (await this.tombstone.isTombstoned(GLOBAL_LIMIT_KEY, t)) {
      this.metrics?.increment('tombstoned');
      return null;
    }
    const allowed = await this.rateLimit.tryAcquire({
      key: GLOBAL_LIMIT_KEY,
      max: rateLimit.max,
      windowMs: rateLimit.windowMs,
      nowMs: t,
    });
    if (!allowed) {
      this.metrics?.increment('rate_limit_rejected');
      return null;
    }

    const { ok, city } = await runProbe(this.inner, lat, lng);
    if (ok) await this.tombstone.recordSuccess(GLOBAL_LIMIT_KEY);
    else
      await this.tombstone.recordFailure({
        key: GLOBAL_LIMIT_KEY,
        nowMs: t,
        threshold: TOMBSTONE_AFTER_FAILURES,
        durationMs: TOMBSTONE_MS,
      });

    // TTL=0 у налаштуваннях = «не кешувати» (перевірено юнит-тестом).
    if (cacheTtlMs > 0) {
      const entry: CachedCity = { city: city?.city ?? null, expiresAt: t + cacheTtlMs };
      await this.cache.set(key, entry, Math.min(cacheTtlMs, CACHE_TTL_MAX_MS));
    }
    this.metrics?.increment(ok ? 'provider_success' : 'provider_failure');
    return city;
  }
}
