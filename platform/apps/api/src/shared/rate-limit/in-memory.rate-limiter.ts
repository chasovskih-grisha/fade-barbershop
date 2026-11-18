// In-memory адаптер (dev/test): ковзне вікно на ключ — патерн
// LocalGeocoderRateLimitStore. Очистка старих точок — лінива, при кожному
// tryAcquire (без фонових таймерів — жодних утечь у тестах).
import type { RateLimitDecision, RateLimiter, RateLimitPolicy } from './rate-limiter';

export class InMemoryRateLimiter implements RateLimiter {
  private readonly calls = new Map<string, number[]>();

  constructor(private readonly policy: RateLimitPolicy) {}

  async tryAcquire(key: string, nowMs = Date.now()): Promise<RateLimitDecision> {
    const fresh = (this.calls.get(key) ?? []).filter((ts) => nowMs - ts < this.policy.windowMs);
    if (fresh.length >= this.policy.max) {
      this.calls.set(key, fresh);
      const oldest = fresh[0] ?? nowMs;
      return {
        allowed: false,
        retryAfterSec: Math.max(1, Math.ceil((oldest + this.policy.windowMs - nowMs) / 1000)),
      };
    }
    fresh.push(nowMs);
    this.calls.set(key, fresh);
    return { allowed: true, retryAfterSec: 0 };
  }
}
