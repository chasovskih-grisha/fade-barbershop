// Спільний 429 для лімітованих ендпоінтів (T-4410): однакове тіло відповіді
// { code, message, retryAfterSec } + метрика порушення
// (fade_rate_limit_violations_total). Ключ будує контролер — він знає свій
// простір ключів (номер/IP/пристрій).
import { HttpException, HttpStatus } from '@nestjs/common';
import type { RateLimiter } from './rate-limiter';
import type { RateLimitMetrics } from './rate-limit.metrics';

/** Дозвіл лімітера або HttpException 429 з метрикою порушення. */
export async function acquireOrThrow429(
  limiter: RateLimiter,
  key: string,
  violations: RateLimitMetrics
): Promise<void> {
  const decision = await limiter.tryAcquire(key);
  if (decision.allowed) return;
  violations.increment();
  throw new HttpException(
    { code: 'RATE_LIMITED', message: 'Too many requests', retryAfterSec: decision.retryAfterSec },
    HttpStatus.TOO_MANY_REQUESTS
  );
}
