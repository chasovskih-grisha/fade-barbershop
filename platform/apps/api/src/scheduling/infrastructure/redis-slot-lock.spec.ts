/* eslint-disable max-params -- фейк повторює сигнатуру ioredis set/eval */
// T-4802: Redlock-адаптер — кворум, звільнення лише свого токена, TTL і
// поведінка при недоступному інстансі.
import { RedisSlotLock, type RedisLockClient } from './redis-slot-lock';

class FakeRedis implements RedisLockClient {
  readonly data = new Map<string, { token: string; expiresAt: number }>();
  down = false;
  constructor(private readonly clock: () => number = () => Date.now()) {}

  async set(key: string, value: string, _mode: 'PX', ttlMs: number, _nx: 'NX') {
    if (this.down) throw new Error('redis down');
    const current = this.data.get(key);
    if (current && current.expiresAt > this.clock()) return null;
    this.data.set(key, { token: value, expiresAt: this.clock() + ttlMs });
    return 'OK';
  }

  async get(key: string): Promise<string | null> {
    if (this.down) throw new Error('redis down');
    const current = this.data.get(key);
    return current && current.expiresAt > this.clock() ? current.token : null;
  }

  async eval(_script: string, _numKeys: number, key: string, token: string): Promise<number> {
    if (this.down) throw new Error('redis down');
    if (this.data.get(key)?.token === token) {
      this.data.delete(key);
      return 1;
    }
    return 0;
  }
}

describe('RedisSlotLock (T-4802)', () => {
  it('бере лок при кворумі 2 з 3 навіть якщо один інстанс недоступний', async () => {
    const clients = [new FakeRedis(), new FakeRedis(), new FakeRedis()];
    clients[2]!.down = true;
    const lock = new RedisSlotLock(clients);

    await expect(lock.acquire('slot', 'token-a', 60_000)).resolves.toBe(true);
    expect(await lock.find('slot')).toBe('token-a');
  });

  it('без кворуму лок не видається і часткові володіння знімаються', async () => {
    const clients = [new FakeRedis(), new FakeRedis(), new FakeRedis()];
    const lock = new RedisSlotLock(clients);

    const first = await lock.acquire('slot', 'token-a', 60_000);
    expect(first).toBe(true);
    // два інстанси з трьох «впали» — новому володарю кворуму не вистачить
    clients[1]!.down = true;
    clients[2]!.down = true;
    await expect(lock.acquire('slot', 'token-b', 60_000)).resolves.toBe(false);
    expect(clients[0]!.data.get('slot')?.token).toBe('token-a');
  });

  it('звільняє лише свій токен', async () => {
    const clients = [new FakeRedis()];
    const lock = new RedisSlotLock(clients);
    await lock.acquire('slot', 'token-a', 60_000);

    await expect(lock.release('slot', 'token-b')).resolves.toBe(false);
    await expect(lock.release('slot', 'token-a')).resolves.toBe(true);
    await expect(lock.find('slot')).resolves.toBeNull();
  });

  it('не видає лок, якщо на взяття пішло більше TTL (втрачена актуальність)', async () => {
    let now = 0;
    const redis = new FakeRedis(() => now);
    const lock = new RedisSlotLock([redis], () => now);
    // кожен виклик set зсуває час — імітуємо повільний інстанс
    const slow: RedisLockClient = {
      set: async (key, value, mode, ttl, nx) => {
        const result = await redis.set(key, value, mode, ttl, nx);
        now += 70_000;
        return result;
      },
      get: (key) => redis.get(key),
      eval: (script, n, key, token) => redis.eval(script, n, key, token),
    };

    await expect(new RedisSlotLock([slow], () => now).acquire('slot', 't', 60_000)).resolves.toBe(
      false
    );
    await expect(lock.acquire('slot', 't2', 60_000)).resolves.toBe(true);
  });
});
