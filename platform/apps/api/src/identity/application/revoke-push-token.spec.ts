// RevokePushToken (T-070/T-4422): вимкнути канал пристрою. Ідемпотентно —
// повторний/невідомий/чужий токен не є помилкою, бо клієнт викликає його на
// виході з акаунта і не має боротися з 404.
import { RevokePushTokenHandler } from './revoke-push-token';
import { RegisterPushTokenHandler } from './register-push-token';
import { FakePushTokenRepository } from './push-token.fakes';
import { FakeClock, UuidIds, passthroughUow } from './ports.fakes';
import { SESSION_1, USER_1, USER_2 } from './test-ids';

const T0 = '2026-10-07T09:00:00.000Z';
const TOKEN = 'ExpoPushToken[device-1]';

const setup = () => {
  const tokens = new FakePushTokenRepository();
  const clock = new FakeClock(T0);
  const register = new RegisterPushTokenHandler({
    tokens,
    ids: new UuidIds(),
    clock,
    uow: passthroughUow,
  });
  const handler = new RevokePushTokenHandler({ tokens, clock, uow: passthroughUow });
  return { tokens, register, handler };
};

const seed = (register: RegisterPushTokenHandler, userId = USER_1) =>
  register.handle({ userId, sessionId: SESSION_1, token: TOKEN });

describe('RevokePushToken (T-070/T-4422)', () => {
  it('вимикає канал свого пристрою (revoked: true, active: false)', async () => {
    const { tokens, register, handler } = setup();
    await seed(register);

    const result = await handler.handle({ userId: USER_1, token: TOKEN });

    expect(result).toEqual({ ok: true, revoked: true });
    expect(tokens.all[0]?.active).toBe(false);
  });

  it('повторний виклик ідемпотентний (revoked: false, без помилки)', async () => {
    const { register, handler } = setup();
    await seed(register);
    await handler.handle({ userId: USER_1, token: TOKEN });

    const again = await handler.handle({ userId: USER_1, token: TOKEN });

    expect(again).toEqual({ ok: true, revoked: false });
  });

  it('порожній токен — тихий no-op', async () => {
    const { handler } = setup();

    const result = await handler.handle({ userId: USER_1, token: '   ' });

    expect(result).toEqual({ ok: true, revoked: false });
  });

  it('чужого користувача не чіпаємо (revoked: false, канал лишається живим)', async () => {
    const { tokens, register, handler } = setup();
    await seed(register, USER_1);

    const result = await handler.handle({ userId: USER_2, token: TOKEN });

    expect(result).toEqual({ ok: true, revoked: false });
    expect(tokens.all[0]?.active).toBe(true);
  });
});
