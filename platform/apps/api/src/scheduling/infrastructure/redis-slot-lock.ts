// Redis-адаптер розподіленого лока (T-4802), Redlock-протокол: незалежні
// інстанси Redis, кворум N/2+1, TTL на кожному SET, звільнення лише своєї
// власності через Lua compare-and-delete. Якщо кворум не зібрано — лок
// відпускається на всіх, хто встиг його взяти (часткові володіння небезпечні).
import type { SlotLockStore } from '../application/slot-lock.ports';

/** Мінімум ioredis-подібного клієнта: без імпорту пакета в тестах і dev. */
export interface RedisLockClient {
  set(
    key: string,
    value: string,
    mode: 'PX',
    ttlMs: number,
    nx: 'NX'
  ): Promise<'OK' | string | null>;
  get(key: string): Promise<string | null>;
  eval(script: string, numKeys: number, key: string, token: string): Promise<unknown>;
}

const RELEASE_SCRIPT =
  'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end';

export class RedisSlotLock implements SlotLockStore {
  constructor(
    private readonly clients: RedisLockClient[],
    private readonly clock: () => number = () => Date.now()
  ) {
    if (clients.length === 0) throw new RangeError('RedisSlotLock needs at least one client');
  }

  async acquire(key: string, token: string, ttlMs: number): Promise<boolean> {
    const quorum = Math.floor(this.clients.length / 2) + 1;
    const startedAt = this.clock();
    const results = await Promise.all(
      this.clients.map(async (client) => {
        try {
          return (await client.set(key, token, 'PX', ttlMs, 'NX')) === 'OK';
        } catch {
          return false; // недоступний інстанс не блокує кворум, але й не рахується
        }
      })
    );
    const granted = results.filter(Boolean).length;
    const elapsed = this.clock() - startedAt;
    if (granted >= quorum && elapsed < ttlMs) return true;
    await this.release(key, token);
    return false;
  }

  async release(key: string, token: string): Promise<boolean> {
    const results = await Promise.all(
      this.clients.map(async (client) => {
        try {
          return Number(await client.eval(RELEASE_SCRIPT, 1, key, token)) === 1;
        } catch {
          return false;
        }
      })
    );
    return results.some(Boolean);
  }

  async find(key: string): Promise<string | null> {
    for (const client of this.clients) {
      try {
        const holder = await client.get(key);
        if (holder) return holder;
      } catch {
        // інший інстанс може відповісти; split-brain тут не лікуємо
      }
    }
    return null;
  }
}
