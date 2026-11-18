// Redis адаптер (прод): ковзне вікно через ZSET — ZADD точку, ZREMRANGEBYSCORE
// старі, ZCARD рахунок, EXPIRE TTL. Логіка атомарна в межах одного ключа
// (одиночні команди по черзі — конкурентність ок для лімітів застосунку).
import type { RateLimitDecision, RateLimiter, RateLimitPolicy } from './rate-limiter';

export interface RedisLike {
  zadd(key: string, score: number, member: string): Promise<unknown>;
  zremrangebyscore(key: string, min: number | string, max: number | string): Promise<unknown>;
  zcard(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
}

export class RedisRateLimiter implements RateLimiter {
  constructor(
    private readonly redis: RedisLike,
    private readonly policy: RateLimitPolicy
  ) {}

  async tryAcquire(key: string, nowMs = Date.now()): Promise<RateLimitDecision> {
    try {
      const zkey = 'ratelimit:' + key;
      const member = String(nowMs) + ':' + Math.random().toString(36).slice(2, 8);
      const min = nowMs - this.policy.windowMs;
      await this.redis.zadd(zkey, nowMs, member);
      await this.redis.zremrangebyscore(zkey, '-inf', min);
      const count = await this.redis.zcard(zkey);
      await this.redis.expire(zkey, Math.ceil(this.policy.windowMs / 1000));
      if (count > this.policy.max) {
        return { allowed: false, retryAfterSec: Math.ceil(this.policy.windowMs / 1000) };
      }
      return { allowed: true, retryAfterSec: 0 };
    } catch {
      // Fail-open resilience: fallback to allowed if Redis experiences connection/timeout issues
      return { allowed: true, retryAfterSec: 0 };
    }
  }
}
