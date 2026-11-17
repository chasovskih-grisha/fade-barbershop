// FakeRedis — скриптований RedisLike-фейк для специфікацій redis-сховищ:
// відтворює семантику Lua-скриптів (ковзне вікно на ZSET, надгробок через
// INCR+поріг, видалення) і PX-TTL рядкових значень. Годинник внутрішній —
// advance(ms) рухає час уперед. Тестовий подвійний, не продуктивний код.

import type { RedisLike } from './redis-geocoder-stores';

interface ZEntry {
  score: number;
  member: string;
}

export class FakeRedis implements RedisLike {
  readonly strings = new Map<string, string>();
  readonly zsets = new Map<string, ZEntry[]>();
  readonly counters = new Map<string, number>();
  private readonly expireAt = new Map<string, number>();
  private nowMs = 1_700_000_000_000;
  private seq = 0;

  /** Зсув фейкового годинника — «перебіг часу» для PX і надгробка. */
  advance(ms: number): void {
    this.nowMs += ms;
  }

  private expired(key: string): boolean {
    const at = this.expireAt.get(key);
    return at !== undefined && at <= this.nowMs;
  }

  async get(key: string): Promise<string | null> {
    if (this.expired(key)) return null;
    return this.strings.get(key) ?? null;
  }

  /** ioredis-стиль set(key, value, mode, ttl) — більше 3 параметрів за ADR 0019 не лічится: варіадик. */
  async set(...args: [string, string, 'PX', number]): Promise<unknown> {
    const [key, value, mode, ttlMs] = args;
    if (mode !== 'PX') throw new Error('FakeRedis підтримує лише PX');
    this.strings.set(key, value);
    this.expireAt.set(key, this.nowMs + ttlMs);
    return 'OK';
  }

  eval(script: string, numKeys: number, ...args: string[]): Promise<unknown> {
    if (script.includes('ZREMRANGEBYSCORE')) return Promise.resolve(this.evalRateLimit(args));
    if (script.includes("'INCR'")) return Promise.resolve(this.evalTombstone(numKeys, args));
    if (script.includes("'DEL'")) return Promise.resolve(this.evalExpunge(numKeys, args));
    return Promise.reject(new Error('unsupported script'));
  }

  on(): unknown {
    return this;
  }

  /** RATE_LIMIT_LUA: чистка вікна + перевірка ZCARD + ZADD нового слота. */
  private evalRateLimit(args: string[]): number {
    const [key, nowS, windowS, maxS] = args;
    if (!key) throw new Error('FakeRedis: key required');
    const now = Number(nowS);
    const entries = (this.zsets.get(key) ?? []).filter((e) => now - e.score < Number(windowS));
    if (entries.length >= Number(maxS)) {
      this.zsets.set(key, entries);
      return 0;
    }
    entries.push({ score: now, member: `${now}:${this.seq++}` });
    this.zsets.set(key, entries);
    return 1;
  }

  /** TOMBSTONE_LUA: INCR збоїв + PEXPIRE; поріг → надгробок і скидання. */
  private evalTombstone(numKeys: number, args: string[]): number {
    const keys = args.slice(0, numKeys);
    const [thresholdS, durationS] = args.slice(numKeys);
    const [failuresKey, tombKey] = keys;
    if (!failuresKey || !tombKey) throw new Error('FakeRedis: keys required');
    const duration = Number(durationS);
    const count = (this.counters.get(failuresKey) ?? 0) + 1;
    this.expireAt.set(failuresKey, this.nowMs + duration);
    if (count >= Number(thresholdS)) {
      this.strings.set(tombKey, '1');
      this.expireAt.set(tombKey, this.nowMs + duration);
      this.counters.delete(failuresKey);
    } else {
      this.counters.set(failuresKey, count);
    }
    return count;
  }

  /** EXPUNGE_LUA: DEL лічильника збоїв (успіх провайдера). */
  private evalExpunge(numKeys: number, args: string[]): number {
    const key = args.slice(0, numKeys)[0];
    if (!key) throw new Error('FakeRedis: key required');
    this.counters.delete(key);
    this.expireAt.delete(key);
    return 1;
  }
}
