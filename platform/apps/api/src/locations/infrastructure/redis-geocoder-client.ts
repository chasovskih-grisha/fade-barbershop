// Redis клієнт і базовий fail-open store для геокодера (ADR 0050).

import { Logger } from '@nestjs/common';

const KEY_PREFIX = 'geocoder';

export function scopedKey(adapter: string, scope: string, key: string): string {
  return `${KEY_PREFIX}:${adapter}:${scope}:${key}`;
}

/** Мінімальний інтерфейс клієнта: усе, що використовують адаптери. */
export interface RedisLike {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode: 'PX', ttlMs: number): Promise<unknown>;
  eval(script: string, numKeys: number, ...args: string[]): Promise<unknown>;
  on(event: string, listener: (...args: unknown[]) => void): unknown;
}

let clientPromise: Promise<RedisLike | null> | null = null;

/** Лінива ініціалізація ioredis; без URL або без пакета → null (fail-open). */
export function getRedisClient(url: string | undefined): Promise<RedisLike | null> {
  if (!url) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = (async () => {
      try {
        const specifier = 'ioredis';
        const mod = (await import(/* webpackIgnore: true */ specifier)) as unknown as {
          default: new (u: string, o: object) => RedisLike;
        };
        const client = new mod.default(url, {
          maxRetriesPerRequest: 2,
          connectTimeout: 2000,
          lazyConnect: false,
          enableOfflineQueue: false,
        });
        client.on('error', () => undefined);
        return client;
      } catch {
        return null;
      }
    })();
  }
  return clientPromise;
}

/** Фасад над ленивым клієнтом із fail-open політикою (деградація, не виняток). */
export abstract class RedisStore {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly adapter: string,
    protected readonly client: Promise<RedisLike | null>
  ) {}

  protected async withClient<T>(fallback: T, fn: (redis: RedisLike) => Promise<T>): Promise<T> {
    try {
      const redis = await this.client;
      if (!redis) return fallback;
      return await fn(redis);
    } catch {
      return fallback;
    }
  }
}
