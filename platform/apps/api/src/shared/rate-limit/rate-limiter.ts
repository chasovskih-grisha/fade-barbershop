// RateLimiter (T-4410) — спільний шар обмеження частоти: ковзне вікно на ключ
// (номер/IP/пристрій). Адаптери: in-memory (dev/test) і Redis (прод, T-4210
// gateway не замінює — це рівень застосунку). Порушення лічильник — метрика
// для T-4204 (/metrics → fade_rate_limit_violations_total).
export interface RateLimitDecision {
  allowed: boolean;
  retryAfterSec: number;
}

export interface RateLimiter {
  tryAcquire(key: string, nowMs?: number): Promise<RateLimitDecision>;
}

export interface RateLimitPolicy {
  max: number;
  windowMs: number;
}

/** Політики для OTP-контурів (ADR 0005): request — 5/год на номер,
 * verify — 10/год на номер (перебір кодів дорожчий за спам request). */
export const OTP_POLICIES = {
  request: { max: 5, windowMs: 3_600_000 } as RateLimitPolicy,
  verify: { max: 10, windowMs: 3_600_000 } as RateLimitPolicy,
} as const;

export class RateLimitExceededError extends Error {
  constructor(public readonly retryAfterSec: number) {
    super('Rate limit exceeded');
  }
}
