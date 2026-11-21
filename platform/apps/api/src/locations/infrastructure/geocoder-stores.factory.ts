// Фабрика сховищ геокодера (ADR 0050): за FADE_GEOCODER_STORE збирає
// in-process або Redis-реалізації трьох портів. Redis активується лише
// коли задано FADE_REDIS_URL і встановлено ioredis; інакше — прозорий
// fallback на local (fail-open дух ADR: геокодер не критичний до Redis).

import { Injectable, Logger } from '@nestjs/common';
import type {
  GeocoderCacheStore,
  GeocoderRateLimitStore,
  GeocoderTombstoneStore,
} from '../domain/geocoder-stores';
import {
  LocalGeocoderCacheStore,
  LocalGeocoderRateLimitStore,
  LocalGeocoderTombstoneStore,
} from './local-geocoder-stores';
import {
  RedisGeocoderCacheStore,
  RedisGeocoderRateLimitStore,
  RedisGeocoderTombstoneStore,
  getRedisClient,
  type RedisLike,
} from './redis-geocoder-stores';

export type GeocoderStoreMode = 'local' | 'redis';

export interface GeocoderStoreSet {
  cache: GeocoderCacheStore;
  rateLimit: GeocoderRateLimitStore;
  tombstone: GeocoderTombstoneStore;
  mode: GeocoderStoreMode;
}

/** Опис активного режиму сховищ одного адаптера (для /health). */
export interface GeocoderStoreSetDescription {
  adapter: string;
  configured: GeocoderStoreMode;
  /** Фактичний режим: redis без клієнта деградує до local-поведінки (fail-open). */
  effective: GeocoderStoreMode;
  redisUnavailable: boolean;
}

@Injectable()
export class GeocoderStoresFactory {
  private readonly logger = new Logger(GeocoderStoresFactory.name);

  /** Окремий набір на адаптера провайдера (окремі бюджети лімітів). */
  forAdapter(adapter: string): GeocoderStoreSet {
    const mode = (process.env.FADE_GEOCODER_STORE as GeocoderStoreMode | undefined) ?? 'local';
    if (mode === 'redis') {
      const client = getRedisClient(process.env.FADE_REDIS_URL);
      // Перевірка доступності пакета — асинхронна; обидва адаптери чесно
      // деградують, якщо ioredis не встановлено (client = null).
      void client.then((c) => {
        if (!c)
          this.logger.warn(
            `FADE_GEOCODER_STORE=redis, але Redis недоступний (${adapter}) — fail-open на провайдера`
          );
      });
      this.logger.log(`geocoder stores (${adapter}): redis`);
      return {
        cache: new RedisGeocoderCacheStore(adapter, client),
        rateLimit: new RedisGeocoderRateLimitStore(adapter, client),
        tombstone: new RedisGeocoderTombstoneStore(adapter, client),
        mode: 'redis',
      };
    }
    return {
      cache: new LocalGeocoderCacheStore(),
      rateLimit: new LocalGeocoderRateLimitStore(),
      tombstone: new LocalGeocoderTombstoneStore(),
      mode: 'local',
    };
  }

  /** Опис режиму сховищ адаптера (кеш/ліміти/надгробок) — без побудови сховищ. */
  async describe(adapter: string): Promise<GeocoderStoreSetDescription> {
    const configured =
      (process.env.FADE_GEOCODER_STORE as GeocoderStoreMode | undefined) ?? 'local';
    if (configured === 'redis') {
      const client = await getRedisClient(process.env.FADE_REDIS_URL);
      const available = client !== null;
      return {
        adapter,
        configured,
        effective: available ? 'redis' : 'local',
        redisUnavailable: !available,
      };
    }
    return { adapter, configured: 'local', effective: 'local', redisUnavailable: false };
  }
}

/** Тип-вартість для тестів: Redis-подібний клієнт, зібраний вручну. */
export type { RedisLike };
