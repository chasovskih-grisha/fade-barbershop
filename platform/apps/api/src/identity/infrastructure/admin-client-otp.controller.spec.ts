// Rate limit on admin client OTP request (T-2400c): the endpoint sends SMS to
// a client number, so the controller checks the limiter BEFORE the handler,
// a denial is 429 RATE_LIMITED with retryAfterSec, and the key is per number.

import { AdminClientOtpController } from './admin-client-otp.controller';
import type { RateLimiter, RateLimitDecision } from '../../shared/rate-limit/rate-limiter';
import { RateLimitMetrics } from '../../shared/rate-limit/rate-limit.metrics';

// prettier-ignore
const decision = (allowed: boolean, retryAfterSec = 120): RateLimitDecision => ({ allowed, retryAfterSec });

function fakeLimiter(
  decisions: RateLimitDecision[],
  keys: string[]
): RateLimiter & { keys: string[] } {
  let i = 0;
  return {
    keys,
    async tryAcquire(key: string) {
      keys.push(key);
      return decisions[i++] ?? decision(true);
    },
  };
}

function requestHandler(calls: { n: number }) {
  return {
    deps: {},
    handle: async () => {
      calls.n += 1;
      return { retryAfterSec: 60 };
    },
  };
}

describe('AdminClientOtpController rate limit (T-2400c)', () => {
  let metrics: RateLimitMetrics;

  beforeEach(() => {
    metrics = new RateLimitMetrics();
  });

  it('request проходить через лімітер з ключем на номер і викликає хендлер', async () => {
    const keys: string[] = [];
    const limiter = fakeLimiter([decision(true)], keys);
    const calls = { n: 0 };
    const controller = new AdminClientOtpController(requestHandler(calls) as never, {} as never, {
      limiter,
      violations: metrics,
    });

    const result = await controller.request({ phone: '+380501114446' });

    expect(keys).toEqual(['admin-client-otp:+380501114446']);
    expect(calls.n).toBe(1);
    expect(metrics.total).toBe(0);
    expect(result).toEqual({ retryAfterSec: 60 });
  });

  it('перевищення ліміту → 429 RATE_LIMITED, хендлер НЕ викликається', async () => {
    const calls = { n: 0 };
    const limiter = fakeLimiter([decision(false, 90)], []);
    const controller = new AdminClientOtpController(requestHandler(calls) as never, {} as never, {
      limiter,
      violations: metrics,
    });

    await expect(controller.request({ phone: '+380501114446' })).rejects.toMatchObject({
      status: 429,
    });

    expect(calls.n).toBe(0);
    expect(metrics.total).toBe(1);
  });
});
