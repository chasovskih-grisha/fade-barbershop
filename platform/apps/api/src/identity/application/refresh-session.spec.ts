// Тести RefreshSessionHandler (T-014): атомарна ротація пари, reuse-детект
// (старий refresh після ротації → повний logout), прострочений refresh,
// відкликана сесія. Додаткові кейси — у refresh-session.reuse.spec.ts.

import { RefreshTokenInvalidError, RefreshTokenReuseError } from './identity-errors';
import { generateToken, hashToken } from '../domain/otp-code';
import { ACCESS_TTL, REFRESH_TTL, T0, seedMobileSession, setup } from './refresh-session.fakes';
import { SESSION_1, USER_1 } from './test-ids';

describe('RefreshSessionHandler', () => {
  it('ротація: нова пара, старий refresh більше не працює, подія session.refreshed', async () => {
    const { handler, sessions, users, outbox } = setup();
    const { refreshToken } = await seedMobileSession(sessions, users);

    const result = await handler.handle({ refreshToken });
    expect(result.token).toHaveLength(64);
    expect(result.refreshToken).toHaveLength(64);
    expect(result.refreshToken).not.toBe(refreshToken);
    expect(result.expiresInSec).toBe(ACCESS_TTL);
    expect(result.userId).toBe(USER_1);
    expect(result.phone).toBe('+380501234567');

    // Ротація зберігає sessionId і оновлює хеші (тільки хеші, не сирі значення).
    const stored = await sessions.findByRefreshHash(hashToken(result.refreshToken));
    if (!stored) throw new Error('rotated session not found');
    expect(stored.id).toBe(SESSION_1);
    expect(stored.refreshTokenHash).not.toBe(hashToken(refreshToken));
    expect(await sessions.findByRefreshHash(hashToken(refreshToken))).toBeNull();

    expect(outbox.events.map((e) => e.type)).toEqual(['identity.session.refreshed']);
  });

  it('reuse старого refresh → REFRESH_TOKEN_REUSE + сесія повністю відкликана + SessionRevoked', async () => {
    const { handler, sessions, users, outbox } = setup();
    const { refreshToken } = await seedMobileSession(sessions, users);

    // Перша ротація успішна — сесія тримає previous = старий refresh.
    const first = await handler.handle({ refreshToken });

    // Друга спроба зі СТАРИМ refresh — reuse (one-step історія).
    await expect(handler.handle({ refreshToken })).rejects.toBeInstanceOf(RefreshTokenReuseError);

    // Сесія мертва: і нова пара вже не працює.
    const rotated = await sessions.findByRefreshHash(hashToken(first.refreshToken));
    if (!rotated) throw new Error('rotated session not found');
    expect(rotated.active).toBe(false);
    expect(outbox.events.map((e) => e.type)).toEqual([
      'identity.session.refreshed',
      'identity.session.revoked',
    ]);
  });

  it('прострочений refresh → REFRESH_TOKEN_INVALID + сесія відкликана', async () => {
    const { handler, sessions, users, outbox, clock } = setup();
    const { refreshToken } = await seedMobileSession(sessions, users);

    clock.advance((REFRESH_TTL + 60) * 1000); // за межі TTL refresh
    await expect(handler.handle({ refreshToken })).rejects.toBeInstanceOf(RefreshTokenInvalidError);

    const stored = await sessions.findByRefreshHash(hashToken(refreshToken));
    if (!stored) throw new Error('session not found');
    expect(stored.active).toBe(false);
    expect(outbox.events.map((e) => e.type)).toEqual(['identity.session.revoked']);
  });

  it('відкликана сесія (logout/зміна пароля) → REFRESH_TOKEN_INVALID без reuse-шуму', async () => {
    const { handler, sessions, users, outbox } = setup();
    const { session, refreshToken } = await seedMobileSession(sessions, users);
    session.revoke(new Date(T0));
    await sessions.save(session);

    await expect(handler.handle({ refreshToken })).rejects.toBeInstanceOf(RefreshTokenInvalidError);
    expect(outbox.events).toEqual([]); // вже відкликана — другої події немає
  });

  it('невідомий refresh → REFRESH_TOKEN_INVALID', async () => {
    const { handler } = setup();
    await expect(handler.handle({ refreshToken: generateToken() })).rejects.toBeInstanceOf(
      RefreshTokenInvalidError
    );
    await expect(handler.handle({ refreshToken: '  ' })).rejects.toBeInstanceOf(
      RefreshTokenInvalidError
    );
  });
});
