import type { RateLimitDecision, RateLimiter } from './rate-limiter';
import {
  captchaRequired,
  IpBlacklist,
  rateLimitKey,
  TieredRateLimiter,
  TIER_POLICIES,
} from './rate-limit-tiers';

class FakeLimiter implements RateLimiter {
  readonly keys: string[] = [];
  constructor(public allowed: boolean) {}

  async tryAcquire(key: string): Promise<RateLimitDecision> {
    this.keys.push(key);
    return this.allowed
      ? { allowed: true, retryAfterSec: 0 }
      : { allowed: false, retryAfterSec: 30 };
  }
}

function limiters(allowed: boolean): Record<'public' | 'auth' | 'booking' | 'admin', RateLimiter> {
  return {
    public: new FakeLimiter(allowed),
    auth: new FakeLimiter(allowed),
    booking: new FakeLimiter(allowed),
    admin: new FakeLimiter(allowed),
  };
}

describe('tier keys and captcha thresholds (T-5016)', () => {
  it('prefers user, then device, then IP', () => {
    expect(rateLimitKey('booking', { userId: 'u1', ip: '1.1.1.1' })).toBe('booking:user:u1');
    expect(rateLimitKey('booking', { deviceId: 'd1', ip: '1.1.1.1' })).toBe('booking:device:d1');
    expect(rateLimitKey('booking', { ip: '1.1.1.1' })).toBe('booking:ip:1.1.1.1');
    expect(rateLimitKey('public', {})).toBe('public:ip:unknown');
  });

  it('demands a captcha once the tier threshold is reached', () => {
    expect(captchaRequired('auth', TIER_POLICIES.auth.captchaAfter - 1)).toBe(false);
    expect(captchaRequired('auth', TIER_POLICIES.auth.captchaAfter)).toBe(true);
    expect(TIER_POLICIES.auth.max).toBeGreaterThanOrEqual(TIER_POLICIES.auth.captchaAfter);
  });
});

describe('IpBlacklist (T-5016)', () => {
  it('blocks until expiry and prunes stale entries', () => {
    const blacklist = new IpBlacklist();
    blacklist.block('1.1.1.1', 2_000);
    expect(blacklist.isBlocked('1.1.1.1', 1_000)).toBe(true);
    expect(blacklist.isBlocked('1.1.1.1', 2_000)).toBe(false);
    expect(blacklist.isBlocked('9.9.9.9')).toBe(false);

    blacklist.block('2.2.2.2', 500);
    blacklist.prune(1_000);
    expect(blacklist.size).toBe(0);
  });
});

describe('TieredRateLimiter (T-5016)', () => {
  it('passes a scoped key to the tier limiter and allows the request', async () => {
    const auth = new FakeLimiter(true);
    const decision = await new TieredRateLimiter({ ...limiters(true), auth }).check(
      'auth',
      { userId: 'u1' },
      1_000
    );
    expect(decision).toMatchObject({ allowed: true, captchaRequired: false, blacklisted: false, tier: 'auth' });
    expect(auth.keys).toEqual(['auth:user:u1']);
  });

  it('challenges on denial and blocks the IP after three violations', async () => {
    const limiter = new TieredRateLimiter(limiters(false));
    const identity = { ip: '3.3.3.3' };

    const first = await limiter.check('public', identity, 1_000);
    await limiter.check('public', identity, 1_100);
    const third = await limiter.check('public', identity, 1_200);

    expect(first.captchaRequired).toBe(true);
    expect(first.blacklisted).toBe(false);
    expect(third.blacklisted).toBe(true);

    const blocked = await limiter.check('public', { ip: '3.3.3.3' }, 1_300);
    expect(blocked).toMatchObject({ allowed: false, blacklisted: true, captchaRequired: false });
  });

  it('clears the violation counter after a successful request', async () => {
    const publicLimiter = new FakeLimiter(false);
    const limiter = new TieredRateLimiter({ ...limiters(true), public: publicLimiter });
    const identity = { ip: '4.4.4.4' };

    await limiter.check('public', identity, 1_000);
    await limiter.check('public', identity, 1_100);
    publicLimiter.allowed = true;
    await limiter.check('public', identity, 1_200);
    publicLimiter.allowed = false;
    const afterReset = await limiter.check('public', identity, 1_300);

    expect(afterReset.blacklisted).toBe(false);
  });
});
