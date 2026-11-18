// Контролер push-каналу (T-070/T-4422): реєстрація і відкликання токена.
// Гвард кладе сесію в request — тут перевіряємо і успішні дії, і 401 без сесії.
import type { Request } from 'express';
import { ClientSessionGuard, clientSessionOf } from './client-session.guard';
import { makeController } from './client-sessions.controller.env';
import { SESSION_WEB } from '../application/test-ids';

const TOKEN = 'ExpoPushToken[device-1]';

function reqOf(cookie?: string): Request {
  return {
    cookies: cookie ? { fadoidx: cookie } : {},
    headers: {},
    ip: '203.0.113.5',
  } as unknown as Request;
}

describe('PushTokensController (T-070/T-4422)', () => {
  const { sessions, tokens, pushController, webToken } = makeController();

  it('реєструє токен за сесією з cookie і повертає ok', async () => {
    const request = reqOf(webToken);
    await new ClientSessionGuard(sessions as never).canActivate({
      switchToHttp: () => ({ getRequest: () => request }),
    } as never);

    const result = await pushController.registerPushToken(request, {
      token: TOKEN,
      platform: 'ios',
    });

    expect(result).toEqual({ ok: true });
    expect(tokens.all[0]).toMatchObject({ sessionId: SESSION_WEB, token: TOKEN });
  });

  it('невірний токен → 400 через мапер помилок', async () => {
    const request = reqOf(webToken);
    await new ClientSessionGuard(sessions as never).canActivate({
      switchToHttp: () => ({ getRequest: () => request }),
    } as never);

    await expect(
      pushController.registerPushToken(request, { token: 'сміття' })
    ).rejects.toMatchObject({ status: 400 });
  });

  it('revoke вимикає канал пристрою', async () => {
    const request = reqOf(webToken);
    await new ClientSessionGuard(sessions as never).canActivate({
      switchToHttp: () => ({ getRequest: () => request }),
    } as never);

    await pushController.registerPushToken(request, { token: TOKEN });
    const result = await pushController.revokePushToken(request, { token: TOKEN });

    expect(result).toEqual({ ok: true, revoked: true });
    expect(tokens.all.every((t) => !t.active)).toBe(true);
  });

  it('без сесії гварда → 401 (request без clientSession)', async () => {
    expect(clientSessionOf(reqOf())).toBeUndefined();
    await expect(pushController.revokePushToken(reqOf(), { token: TOKEN })).rejects.toMatchObject({
      status: 401,
    });
  });
});
