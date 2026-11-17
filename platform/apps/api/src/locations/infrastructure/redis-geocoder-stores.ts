// Redis-реалізації сховищ геокодера (ADR 0050) для multi-container:
// кеш і ліміти спільні між інстансами API, надгробок теж глобальний.
// Головна властивість — **fail-open**: Redis недоступний → кожен метод
// деградує (cache miss / слот є / не надгробок). Lua-скрипти — окремий файл;
// клієнт підключається ліниво (dynamic import 'ioredis').

import { Injectable } from '@nestjs/common';
import type {
  CachedCity,
  GeocoderCacheStore,
  GeocoderRateLimitStore,
  GeocoderTombstoneStore,
} from '../domain/geocoder-stores';
import { RATE_LIMIT_LUA, TOMBSTONE_LUA, EXPUNGE_LUA } from './redis-geocoder.lua';
import { RedisStore, scopedKey } from './redis-geocoder-client';

export { getRedisClient, scopedKey, type RedisLike } from './redis-geocoder-client';

@Injectable()
export class RedisGeocoderCacheStore extends RedisStore implements GeocoderCacheStore {
  async get(key: string): Promise<CachedCity | null> {
    return this.withClient<CachedCity | null>(null, async (redis) => {
      const raw = await redis.get(scopedKey(this.adapter, 'cache', key));
      return raw ? (JSON.parse(raw) as CachedCity) : null;
    });
  }

  async set(key: string, value: CachedCity, ttlMs: number): Promise<void> {
    const redis = await this.client;
    if (!redis) return;
    try {
      await redis.set(scopedKey(this.adapter, 'cache', key), JSON.stringify(value), 'PX', ttlMs);
    } catch {
      this.logger.warn('redis cache set failed — fail-open');
    }
  }
}

@Injectable()
export class RedisGeocoderRateLimitStore extends RedisStore implements GeocoderRateLimitStore {
  async tryAcquire(input: {
    key: string;
    max: number;
    windowMs: number;
    nowMs: number;
  }): Promise<boolean> {
    return this.withClient<boolean>(true, (redis) =>
      redis
        .eval(
          RATE_LIMIT_LUA,
          1,
          scopedKey(this.adapter, 'rl', input.key),
          String(input.nowMs),
          String(input.windowMs),
          String(input.max)
        )
        .then((allowed) => allowed === 1)
    );
  }
}

@Injectable()
export class RedisGeocoderTombstoneStore extends RedisStore implements GeocoderTombstoneStore {
  async isTombstoned(key: string, _nowMs: number): Promise<boolean> {
    return this.withClient<boolean>(
      false,
      async (redis) => (await redis.get(scopedKey(this.adapter, 'tomb', key))) === '1'
    );
  }

  async recordFailure(input: {
    key: string;
    nowMs: number;
    threshold: number;
    durationMs: number;
  }): Promise<void> {
    // nowMs не використовується: TTL рахує сервер (PEXPIRE у TOMBSTONE_LUA).
    return this.withClient<void>(undefined, (redis) =>
      redis
        .eval(
          TOMBSTONE_LUA,
          2,
          scopedKey(this.adapter, 'fail', input.key),
          scopedKey(this.adapter, 'tomb', input.key),
          String(input.threshold),
          String(input.durationMs)
        )
        .then(() => undefined)
    );
  }

  async recordSuccess(key: string): Promise<void> {
    return this.withClient<void>(undefined, (redis) =>
      redis.eval(EXPUNGE_LUA, 1, scopedKey(this.adapter, 'fail', key)).then(() => undefined)
    );
  }
}
