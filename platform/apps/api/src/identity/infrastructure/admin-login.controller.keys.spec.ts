// Додаткові rate-limit кейси AdminLoginController (T-4410): X-Forwarded-For,
// незалежні ключі для різних username.
import { AdminLoginController } from './admin-login.controller';
import type { RateLimiter, RateLimitDecision } from '../../shared/rate-limit/rate-limiter';
import { RateLimitMetrics } from '../../shared/rate-limit/rate-limit.metrics';
import type { AdminLoginInput } from '@fade/contracts';
import type { Request, Response } from 'express';
import { uuidv7 } from '@fade/domain-shared';

const USER_ID = uuidv7();

function decision(allowed: boolean, retryAfterSec = 120): RateLimitDecision {
  return { allowed, retryAfterSec };
}

function fakeLimiter(
  decisions: RateLimitDecision[],
  keys: string[]
): RateLimiter & { keys: string[] } {
  let i = 0;
  return {
    keys,
    async tryAcquire(key: string) {
      keys.push(key);
      const d = decisions[i];
      i += 1;
      return d ?? decision(true);
    },
  };
}

function makeReq(body: AdminLoginInput, ip = '203.0.113.9', forwarded?: string): Request {
  return {
    body,
    headers: forwarded ? { 'x-forwarded-for': forwarded } : {},
    socket: { remoteAddress: ip },
  } as unknown as Request;
}

function makeRes(): Response {
  const res = {
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

function handler(calls: { n: number }) {
  return {
    deps: {},
    handle: async () => {
      calls.n += 1;
      return { token: 't', userId: USER_ID, username: 'owner', phone: '+380000000001' };
    },
  };
}

describe('AdminLoginController rate limit keys (T-4410)', () => {
  let metrics: RateLimitMetrics;

  beforeEach(() => {
    metrics = new RateLimitMetrics();
  });

  it('X-Forwarded-For (за реверс-проксі) бере перший IP у ключ', async () => {
    const keys: string[] = [];
    const limiter = fakeLimiter([decision(true)], keys);
    const controller = new AdminLoginController(handler({ n: 0 }) as never, limiter, metrics);

    await controller.login(
      { username: 'owner', password: 'x' },
      makeReq({ username: 'owner', password: 'x' }, '10.0.0.1', '203.0.113.5, 10.0.0.1') as never,
      makeRes()
    );

    expect(keys[0]).toBe('admin-login:owner:203.0.113.5');
  });

  it('різні username не ділять ліміт (ключ незалежний)', async () => {
    const keys: string[] = [];
    const limiter = fakeLimiter([], keys);
    const controller = new AdminLoginController(handler({ n: 0 }) as never, limiter, metrics);

    await controller.login(
      { username: 'owner', password: 'x' },
      makeReq({ username: 'owner', password: 'x' }, '203.0.113.9') as never,
      makeRes()
    );
    await controller.login(
      { username: 'manager', password: 'x' },
      makeReq({ username: 'manager', password: 'x' }, '203.0.113.9') as never,
      makeRes()
    );

    expect(keys).toEqual(['admin-login:owner:203.0.113.9', 'admin-login:manager:203.0.113.9']);
  });
});
