// RegisterPushToken (T-070/T-4422): канал сповіщень пристрою.
// Expo-токен унікальний — повторна реєстрація (перелогін/зміна акаунта на
// пристрої) переносить рядок на нову сесію, а не плодить другий; невірна
// форма токена — доменна помилка (400), а не тихий no-op.
import { RegisterPushTokenHandler } from './register-push-token';
import { FakePushTokenRepository } from './push-token.fakes';
import { FakeClock, UuidIds, passthroughUow } from './ports.fakes';
import { InvalidPushTokenError } from './identity-errors';
import { SESSION_1, SESSION_2, SESSION_NEW, SESSION_OLD, SESSION_WEB, USER_1 } from './test-ids';

const T0 = '2026-10-07T09:00:00.000Z';
const TOKEN = 'ExpoPushToken[device-1]';

const setup = () => {
  const tokens = new FakePushTokenRepository();
  const handler = new RegisterPushTokenHandler({
    tokens,
    ids: new UuidIds(),
    clock: new FakeClock(T0),
    uow: passthroughUow,
  });
  return { tokens, handler };
};

describe('RegisterPushToken (T-070/T-4422)', () => {
  it('реєструє Expo-токен за сесією пристрою', async () => {
    const { tokens, handler } = setup();

    const result = await handler.handle({
      userId: USER_1,
      sessionId: SESSION_WEB,
      token: TOKEN,
      platform: 'ios',
    });

    expect(result).toEqual({ ok: true });
    expect(tokens.all).toHaveLength(1);
    expect(tokens.all[0]).toMatchObject({
      userId: USER_1,
      sessionId: SESSION_WEB,
      token: TOKEN,
      platform: 'ios',
      active: true,
    });
  });

  it('нормалізує токен і платформу (trim, невідомий platform → ios)', async () => {
    const { tokens, handler } = setup();

    await handler.handle({
      userId: USER_1,
      sessionId: SESSION_1,
      token: `  ${TOKEN}  `,
      platform: 'toaster',
    });

    expect(tokens.all[0]).toMatchObject({ token: TOKEN, platform: 'ios' });
  });

  it('перелогін тим самим токеном переносить рядок на нову сесію', async () => {
    const { tokens, handler } = setup();
    await handler.handle({ userId: USER_1, sessionId: SESSION_OLD, token: TOKEN });
    await handler.handle({
      userId: USER_1,
      sessionId: SESSION_NEW,
      token: TOKEN,
      platform: 'android',
    });

    expect(tokens.all).toHaveLength(1);
    expect(tokens.all[0]).toMatchObject({ sessionId: SESSION_NEW, platform: 'android' });
  });

  it('повторна реєстрація після вимкнення каналу — знову активна', async () => {
    const { tokens, handler } = setup();
    await handler.handle({ userId: USER_1, sessionId: SESSION_1, token: TOKEN });
    const row = tokens.all[0];
    row?.revoke(new Date(T0));

    await handler.handle({ userId: USER_1, sessionId: SESSION_2, token: TOKEN });

    expect(tokens.all).toHaveLength(1);
    expect(tokens.all[0]?.active).toBe(true);
  });

  it('невірна форма токена — доменна помилка, рядка не створюємо', async () => {
    const { tokens, handler } = setup();

    await expect(
      handler.handle({ userId: USER_1, sessionId: SESSION_1, token: 'not-a-push-token' })
    ).rejects.toBeInstanceOf(InvalidPushTokenError);
    expect(tokens.all).toHaveLength(0);
  });
});
