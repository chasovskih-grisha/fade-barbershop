/**
 * Endpoint-tier rate limiting (T-5016).
 * Extends the existing sliding-window `RateLimiter` core with per-tier
 * policies, caller-scoped keys, captcha escalation and automatic IP blocking.
 */

import type { RateLimiter } from './rate-limiter';

export type EndpointTier = 'public' | 'auth' | 'booking' | 'admin';

export interface TierPolicy {
  readonly max: number;
  readonly windowMs: number;
  /** Requests in the window before a captcha challenge is demanded. */
  readonly captchaAfter: number;
}

export const TIER_POLICIES: Readonly<Record<EndpointTier, TierPolicy>> = {
  public: { max: 120, windowMs: 60_000, captchaAfter: 80 },
  auth: { max: 10, windowMs: 600_000, captchaAfter: 5 },
  booking: { max: 30, windowMs: 60_000, captchaAfter: 20 },
  admin: { max: 60, windowMs: 60_000, captchaAfter: 30 },
};

export interface CallerIdentity {
  readonly ip?: string | undefined;
  readonly userId?: string | undefined;
  readonly deviceId?: string | undefined;
}

/** User beats device beats IP, so one client cannot dodge limits by rotating IPs. */
export function rateLimitKey(tier: EndpointTier, identity: CallerIdentity): string {
  if (identity.userId) return `${tier}:user:${identity.userId}`;
  if (identity.deviceId) return `${tier}:device:${identity.deviceId}`;
  return `${tier}:ip:${identity.ip ?? 'unknown'}`;
}

export function captchaRequired(tier: EndpointTier, requestsInWindow: number): boolean {
  return requestsInWindow >= TIER_POLICIES[tier].captchaAfter;
}

export class IpBlacklist {
  private readonly blockedUntil = new Map<string, number>();

  block(ip: string, untilMs: number): void {
    this.blockedUntil.set(ip, untilMs);
  }

  isBlocked(ip: string, nowMs = Date.now()): boolean {
    const until = this.blockedUntil.get(ip);
    if (until === undefined) return false;
    if (until <= nowMs) {
      this.blockedUntil.delete(ip);
      return false;
    }
    return true;
  }

  prune(nowMs = Date.now()): void {
    for (const [ip, until] of this.blockedUntil) {
      if (until <= nowMs) this.blockedUntil.delete(ip);
    }
  }

  get size(): number {
    return this.blockedUntil.size;
  }
}

export interface TierDecision {
  readonly allowed: boolean;
  readonly retryAfterSec: number;
  readonly captchaRequired: boolean;
  readonly blacklisted: boolean;
  readonly tier: EndpointTier;
}

const VIOLATIONS_BEFORE_BLOCK = 3;
const BLOCK_MS = 15 * 60_000;

/** Wraps one limiter per tier; repeated denials auto-block the caller's IP. */
export class TieredRateLimiter {
  private readonly violations = new Map<string, number>();

  constructor(
    private readonly limiters: Readonly<Record<EndpointTier, RateLimiter>>,
    private readonly blacklist: IpBlacklist = new IpBlacklist()
  ) {}

  async check(
    tier: EndpointTier,
    identity: CallerIdentity,
    nowMs = Date.now()
  ): Promise<TierDecision> {
    const ip = identity.ip;
    if (ip && this.blacklist.isBlocked(ip, nowMs)) {
      return {
        allowed: false,
        retryAfterSec: Math.ceil(BLOCK_MS / 1000),
        captchaRequired: false,
        blacklisted: true,
        tier,
      };
    }
    const decision = await this.limiters[tier].tryAcquire(
      rateLimitKey(tier, identity),
      nowMs
    );
    if (decision.allowed) {
      if (ip) this.violations.delete(ip);
      return { ...decision, captchaRequired: false, blacklisted: false, tier };
    }
    const violations = ip ? (this.violations.get(ip) ?? 0) + 1 : 1;
    if (ip) this.violations.set(ip, violations);
    const blacklisted = violations >= VIOLATIONS_BEFORE_BLOCK;
    if (ip && blacklisted) this.blacklist.block(ip, nowMs + BLOCK_MS);
    return { ...decision, captchaRequired: true, blacklisted, tier };
  }
}
