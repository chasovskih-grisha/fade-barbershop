// Специфікації RateLimiter (T-4410): ковзне вікно, межа вікна, retryAfterSec,
// Redis-адаптер через FakeRedis (zadd/zrem/zcard/expire послідовність).
import { InMemoryRateLimiter } from './in-memory.rate-limiter';
import { RedisRateLimiter, type RedisLike } from './redis.rate-limiter';
import { OTP_POLICIES } from './rate-limiter';

describe('InMemoryRateLimiter', () => {
  const policy = { max: 3, windowMs: 1_000 };

  it('дозволяє max дзвінків у вікні, далі відмова з retryAfterSec', async () => {
    const limiter = new InMemoryRateLimiter(policy);
    let t = 0;
    expect((await limiter.tryAcquire('k', (t += 100))).allowed).toBe(true);
    expect((await limiter.tryAcquire('k', (t += 100))).allowed).toBe(true);
    expect((await limiter.tryAcquire('k', (t += 100))).allowed).toBe(true);
    const denied = await limiter.tryAcquire('k', (t += 100));
    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterSec).toBeGreaterThan(0);
  });

  it('межа вікна: точка виходить з вікна → знову дозволено (ковзне, не фіксоване)', async () => {
    const limiter = new InMemoryRateLimiter(policy);
    let t = 0;
    for (let i = 0; i < 3; i += 1) await limiter.tryAcquire('k', (t += 100));
    // t = 400; у вікні 3 точки → відмова
    expect((await limiter.tryAcquire('k', t + 100)).allowed).toBe(false);
    // перша точка старіє після windowMs: t = 500 + 1000 = 1500 → 100/200/300 поза вікном
    expect((await limiter.tryAcquire('k', 1_400)).allowed).toBe(true);
  });

  it('ключі незалежні (номер/IP), OTP-політики зафіксовані', async () => {
    const limiter = new InMemoryRateLimiter(policy);
    for (let i = 0; i < 3; i += 1) await limiter.tryAcquire('a', 100);
    expect((await limiter.tryAcquire('b', 100)).allowed).toBe(true);
    expect(OTP_POLICIES.request.max).toBe(5);
    expect(OTP_POLICIES.verify.max).toBe(10);
  });
});

describe('RedisRateLimiter', () => {
  function fakeRedis(count: number): { redis: RedisLike; ops: string[] } {
    const ops: string[] = [];
    return {
      ops,
      redis: {
        async zadd(key: string) {
          ops.push('zadd:' + key);
          return 1;
        },
        async zremrangebyscore(key: string) {
          ops.push('zrem:' + key);
          return 1;
        },
        async zcard() {
          ops.push('zcard');
          return count;
        },
        async expire() {
          ops.push('expire');
          return 1;
        },
      },
    };
  }

  it('послідовність ZSET-операцій і рішення за ZCARD', async () => {
    const under = fakeRedis(2);
    const allow = await new RedisRateLimiter(under.redis, { max: 5, windowMs: 60_000 }).tryAcquire(
      'p:+380…',
      1_000
    );
    expect(allow.allowed).toBe(true);
    expect(under.ops).toEqual([
      'zadd:ratelimit:p:+380…',
      'zrem:ratelimit:p:+380…',
      'zcard',
      'expire',
    ]);

    const over = fakeRedis(6);
    const deny = await new RedisRateLimiter(over.redis, { max: 5, windowMs: 60_000 }).tryAcquire(
      'p:x',
      1_000
    );
    expect(deny.allowed).toBe(false);
    expect(deny.retryAfterSec).toBe(60);
  });

  it('fail-open при помилці Redis (відмова зв’язку / таймаут)', async () => {
    const errorRedis: RedisLike = {
      async zadd() {
        throw new Error('Redis connection lost');
      },
      async zremrangebyscore() {
        return 0;
      },
      async zcard() {
        return 0;
      },
      async expire() {
        return 0;
      },
    };
    const limiter = new RedisRateLimiter(errorRedis, { max: 5, windowMs: 60_000 });
    const decision = await limiter.tryAcquire('p:err', 1_000);
    expect(decision.allowed).toBe(true);
  });
});
