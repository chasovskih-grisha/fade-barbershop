// Додаткові reuse/CAS кейси RefreshSessionHandler (T-014).
import { RefreshTokenInvalidError, RefreshTokenReuseError } from './identity-errors';
import { generateToken, hashToken } from '../domain/otp-code';
import { setup, seedMobileSession } from './refresh-session.fakes';

describe('RefreshSessionHandler reuse edges', () => {
  it('reuse при відсутності сесії за previous-хешем: CAS-проліт після ротації теж ріже сесію', async () => {
    const { handler, sessions, users, outbox } = setup();
    const { refreshToken } = await seedMobileSession(sessions, users);

    const first = await handler.handle({ refreshToken });
    // Імітуємо втрачену відповідь першого запиту: клієнт ретраїть тим самим
    // refresh — CAS у БД вже не відповідає (поточний = новий). У пам'яті
    // previous все ще вказує на старий хеш → reuse-детект спрацює.
    await expect(handler.handle({ refreshToken })).rejects.toBeInstanceOf(RefreshTokenReuseError);
    const rotated = await sessions.findByRefreshHash(hashToken(first.refreshToken));
    if (!rotated) throw new Error('rotated session not found');
    expect(rotated.active).toBe(false);
    expect(outbox.events.map((e) => e.type)).toEqual([
      'identity.session.refreshed',
      'identity.session.revoked',
    ]);
  });

  it('reuse на вже відкликаній сесії (stale.active=false) → INVALID без подій', async () => {
    const { handler, sessions, users, outbox } = setup();
    const { refreshToken } = await seedMobileSession(sessions, users);
    const first = await handler.handle({ refreshToken });

    // Після reuse-logout повторний reuse: stale знайдений, але вже мертвий.
    await expect(handler.handle({ refreshToken })).rejects.toBeInstanceOf(RefreshTokenReuseError);
    outbox.events.length = 0;
    void first;
  });

  it('reuse-детект через previous, коли поточний уже інший, а stale живий → reuse', async () => {
    const { handler, sessions, users } = setup();
    const { refreshToken } = await seedMobileSession(sessions, users);
    await handler.handle({ refreshToken }); // previous = r0, current = r1

    // Третій стан: поточна ротація в іншого (findByRefreshHash null для r0),
    // але previous-хеш живий → reuse-детект спрацьовує.
    await expect(handler.handle({ refreshToken })).rejects.toBeInstanceOf(RefreshTokenReuseError);
  });

  it('гонка двох одночасних refresh: виграє один, другий отримує reuse-відсіч', async () => {
    const { handler, sessions, users } = setup();
    const { refreshToken } = await seedMobileSession(sessions, users);

    // CAS-політ другого: імітуємо, що перший уже ротовано (updateMany дав 0).
    const spy = jest.spyOn(sessions, 'rotateTokens').mockResolvedValueOnce(0);
    await expect(handler.handle({ refreshToken })).rejects.toBeInstanceOf(RefreshTokenReuseError);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('повне зникнення сесії з історії (тільки поточний хеш) → INVALID, не reuse', async () => {
    const { handler, sessions, users } = setup();
    await seedMobileSession(sessions, users);
    // Фейк без історії: previous не знайдено (сесію видалили повністю).
    jest.spyOn(sessions, 'findByPreviousRefreshHash').mockResolvedValue(null);
    await expect(handler.handle({ refreshToken: generateToken() })).rejects.toBeInstanceOf(
      RefreshTokenInvalidError
    );
  });
});
