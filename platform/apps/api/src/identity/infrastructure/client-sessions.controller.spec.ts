// Специфікації контролера пристроїв (T-4422): списки, «вийти скрізь»,
// email сповіщень. Канали доступу гварда — client-session.guard.spec.ts.
import type { ExecutionContext } from '@nestjs/common';
import { ClientSessionGuard, clientSessionOf } from './client-session.guard';
import { makeController, FakeSessionRepository } from './client-sessions.controller.env';
import type { Request } from 'express';
import { SESSION_MOBILE, SESSION_WEB } from '../application/test-ids';

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

/** Активує guard для request (спільна передумова всіх тестів). */
function activateGuard(sessions: FakeSessionRepository, request: Request): Promise<unknown> {
  return new ClientSessionGuard(sessions as never).canActivate(contextOf(request));
}

describe('ClientSessionsController (T-4422): списки і дії', () => {
  const { sessions, outbox, limiter, controller, webToken } = makeController();

  it('GET sessions: поточна web-сесія позначена, mobile-сесія інша', async () => {
    const request = reqOf({ cookie: webToken });
    await activateGuard(sessions, request);

    const result = await controller.sessions(request);

    expect(result.sessions).toHaveLength(2);
    expect(result.sessions.find((s) => s.id === SESSION_WEB)?.current).toBe(true);
    expect(result.sessions.find((s) => s.id === SESSION_MOBILE)?.current).toBe(false);
  });

  it('POST revoke-all: ріже інші сесії; подія в outbox; лімітер викликано', async () => {
    const request = reqOf({ cookie: webToken });
    await activateGuard(sessions, request);

    const result = await controller.revokeAllSessions(request);

    expect(result).toEqual({ revokedCount: 1 });
    expect(sessions.all.find((s) => s.id === SESSION_MOBILE)?.active).toBe(false);
    expect(sessions.all.find((s) => s.id === SESSION_WEB)?.active).toBe(true);
    expect(outbox.events.map((e) => e.type)).toEqual(['identity.sessions.revoked.all']);
    expect(limiter.tryAcquire).toHaveBeenCalledWith('client-revoke-all:203.0.113.5');
  });

  it('PUT email: зберігає адресу для сповіщень', async () => {
    const request = reqOf({ cookie: webToken });
    await activateGuard(sessions, request);

    const result = await controller.updateEmail(request, { email: 'me@example.com' });

    expect(result).toEqual({ ok: true, email: 'me@example.com' });
  });

  it('PUT email: некоректна адреса → 400 через мапер помилок', async () => {
    const request = reqOf({ cookie: webToken });
    await activateGuard(sessions, request);

    await expect(controller.updateEmail(request, { email: 'не-пошта' })).rejects.toMatchObject({
      status: 400,
    });
  });

  it('clientSessionOf без авторизації — undefined (гвард обовʼязковий)', () => {
    expect(clientSessionOf(reqOf({ cookie: null }))).toBeUndefined();
  });
});
