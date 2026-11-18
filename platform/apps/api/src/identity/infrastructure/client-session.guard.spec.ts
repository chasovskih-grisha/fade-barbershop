// Специфікації гварда клієнтської сесії (T-4422): web — cookie, mobile —
// Bearer; admin-канал і анонімні відхиляються; ревок/прострочений access — 401.
import type { ExecutionContext } from '@nestjs/common';
import { ClientSessionGuard, clientSessionOf } from './client-session.guard';
import { FakeSessionRepository, seedSession } from '../application/client-sessions.fakes';
import type { Request } from 'express';
import { SESSION_MOBILE, SESSION_OLD, SESSION_WEB, USER_1 } from '../application/test-ids';
import { testId } from '../application/test-ids';

type GuardContext = ExecutionContext;

function contextOf(request: Request): GuardContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as GuardContext;
}

function reqOf(overrides: Partial<{ bearer: string; cookie: string | null }> = {}): Request {
  return {
    cookies: overrides.cookie === null ? {} : { fadoidx: overrides.cookie ?? 'x' },
    headers: overrides.bearer ? { authorization: `Bearer ${overrides.bearer}` } : {},
    ip: '203.0.113.5',
  } as unknown as Request;
}

describe('ClientSessionGuard (T-4422): канали доступу', () => {
  const sessions = new FakeSessionRepository();
  const guard = new ClientSessionGuard(sessions as never);

  it('cookie web-сесії пускає; кладе userId+sessionId у request', async () => {
    const { token } = seedSession(sessions, { id: SESSION_WEB, channel: 'web' });
    const request = reqOf({ cookie: token });

    await expect(guard.canActivate(contextOf(request))).resolves.toBe(true);
    expect(clientSessionOf(request)).toEqual({ userId: USER_1, sessionId: SESSION_WEB });
  });

  it('bearer mobile-сесії пускає, поки access живий', async () => {
    const { token } = seedSession(sessions, {
      id: SESSION_MOBILE,
      channel: 'mobile',
      accessExpiresAt: new Date(Date.now() + 60_000),
    });
    const request = reqOf({ bearer: token, cookie: null });

    await expect(guard.canActivate(contextOf(request))).resolves.toBe(true);
    expect(clientSessionOf(request)?.sessionId).toBe(SESSION_MOBILE);
  });

  it('mobile з простроченим access → 401 (T-014: access живе хвилини)', async () => {
    const { token } = seedSession(sessions, {
      id: SESSION_OLD,
      channel: 'mobile',
      accessExpiresAt: new Date(Date.now() - 60_000),
    });

    await expect(
      guard.canActivate(contextOf(reqOf({ bearer: token, cookie: null })))
    ).rejects.toMatchObject({ status: 401 });
  });

  it('admin-сесію відхиляє (ADR 0017 — ізольований канал)', async () => {
    const { token } = seedSession(sessions, { id: testId(), channel: 'admin' });

    await expect(guard.canActivate(contextOf(reqOf({ cookie: token })))).rejects.toMatchObject({
      status: 401,
    });
  });

  it.each([
    ['без токенів взагалі', reqOf({ cookie: null })],
    ['невідомий токен', reqOf({ cookie: 'garbage' })],
  ])('%s → 401', async (_name, request) => {
    await expect(guard.canActivate(contextOf(request))).rejects.toMatchObject({ status: 401 });
  });

  it('ревокнута сесія → 401', async () => {
    const { token } = seedSession(sessions, { id: testId(), channel: 'web', revoked: true });

    await expect(guard.canActivate(contextOf(reqOf({ cookie: token })))).rejects.toMatchObject({
      status: 401,
    });
  });
});
