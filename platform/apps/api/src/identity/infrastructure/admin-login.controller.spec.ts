// Специфікації rate limit на адмін-логіні (T-4410 extension): контролер
// перевіряє лімітер ДО AdminLoginHandler (перебір паролів не має досягати
// хендлера/аудиту), відмова → 429 RATE_LIMITED з retryAfterSec, метрика
// порушень росте, ключ включає username і IP (різні адміни не заважають).

import { AdminLoginController } from './admin-login.controller';
import type { RateLimiter, RateLimitDecision } from '../../shared/rate-limit/rate-limiter';
import { RateLimitMetrics } from '../../shared/rate-limit/rate-limit.metrics';
import type { AdminLoginInput } from '@fade/contracts';
import type { Request, Response } from 'express';
import { uuidv7 } from '@fade/domain-shared';

const USER_ID = uuidv7();

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

function makeReq(body: AdminLoginInput, ip = '203.0.113.9', forwarded?: string): Request {
  return {
    body,
    headers: forwarded ? { 'x-forwarded-for': forwarded } : {},
    socket: { remoteAddress: ip },
  } as unknown as Request;
}

function makeRes(): Response {
  // prettier-ignore
  const res = { setHeader: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
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

describe('AdminLoginController rate limit (T-4410 extension)', () => {
  let metrics: RateLimitMetrics;

  beforeEach(() => {
    metrics = new RateLimitMetrics();
  });

  it('успішний логін проходить через лімітер: ключ містить username і IP', async () => {
    const keys: string[] = [];
    const limiter = fakeLimiter([decision(true)], keys);
    const calls = { n: 0 };
    const controller = new AdminLoginController(handler(calls) as never, limiter, metrics);

    // У юніт-виклику декоратори НЕ працюють: login(body, req, res) — позиційно.
    const creds = { username: 'owner', password: 'FadeSecret2026' };
    await controller.login(creds, makeReq(creds, '198.51.100.7') as never, makeRes());

    expect(keys).toEqual(['admin-login:owner:198.51.100.7']);
    expect(calls.n).toBe(1);
    expect(metrics.total).toBe(0);
  });

  it('перевищення ліміту → 429 RATE_LIMITED з retryAfterSec, handler НЕ викликається', async () => {
    const calls = { n: 0 };
    const limiter = fakeLimiter([decision(false, 90)], []);
    const controller = new AdminLoginController(handler(calls) as never, limiter, metrics);
    const res = makeRes();

    const creds = { username: 'owner', password: 'whatever' };
    await expect(controller.login(creds, makeReq(creds) as never, res)).rejects.toMatchObject({
      status: 429,
    });

    expect(calls.n).toBe(0);
    expect(metrics.total).toBe(1);
  });
});
