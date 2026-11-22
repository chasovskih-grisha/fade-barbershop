import type { RetryPolicy } from './types';

/** At-least-once delivery defaults: five attempts inside a 30s ceiling. */
export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 5,
  baseDelayMs: 50,
  maxDelayMs: 30_000,
};

/**
 * Exponential backoff with full jitter.
 * Attempt 1 waits in [0, base], attempt n in [0, base * 2^(n-1)], capped.
 */
export function retryDelayMs(
  attempt: number,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY,
  random: () => number = Math.random
): number {
  const exponent = Math.max(0, attempt - 1);
  const ceiling = Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** exponent);
  return Math.round(random() * ceiling);
}

/** True once the attempt budget is spent; the envelope belongs in the DLQ. */
export function attemptsExhausted(attempt: number, policy: RetryPolicy): boolean {
  return attempt >= Math.max(1, policy.maxAttempts);
}
