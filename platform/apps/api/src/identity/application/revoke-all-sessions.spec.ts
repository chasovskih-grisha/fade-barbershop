// RevokeAllSessions (T-4422): «вийти скрізь» закриває всі активні сесії,
// КРІМ поточної (пристрій, з якого натиснули, лишається живим). Ревокнута
// mobile-сесія не може оновити токени (CAS не пройде по ревокованому рядку) —
// access просто догорає за TTL. Одна подія identity.sessions.revoked.all
// з кількістю — сповіщення без дублів (журнал notifications за eventId).
import { RevokeAllSessionsHandler } from './revoke-all-sessions';
import { FakeClock, FakeOutbox, FakeSessionRepository, FakeUserRepository, T0, passthroughUow, seedSession, seedUser } from './client-sessions.fakes';
import { SESSION_MOBILE, USER_1, USER_2, testId } from './test-ids';

const CURRENT = testId();
const OTHER_WEB = testId();
const ALIEN = testId();

const setup = () => {
  const sessions = new FakeSessionRepository();
  const users = new FakeUserRepository();
  const outbox = new FakeOutbox();
  const clock = new FakeClock(T0);
  seedUser(users);
  const handler = new RevokeAllSessionsHandler({
    sessions,
    outbox,
    clock,
    uow: passthroughUow,
  });
  return { sessions, users, outbox, clock, handler };
};

describe('RevokeAllSessions (T-4422): вихід з усіх інших пристроїв', () => {
  it('ревок всіх активних сесій, крім поточної; повертає кількість', async () => {
    const { sessions, handler } = setup();
    seedSession(sessions, { id: CURRENT, channel: 'web' });
    seedSession(sessions, { id: OTHER_WEB, channel: 'web' });
    seedSession(sessions, { id: SESSION_MOBILE, channel: 'mobile' });

    const result = await handler.handle({ userId: USER_1, currentSessionId: CURRENT });

    expect(result.revokedCount).toBe(2);
    expect(sessions.all.find((s) => s.id === CURRENT)?.active).toBe(true);
    expect(sessions.all.find((s) => s.id === OTHER_WEB)?.active).toBe(false);
    expect(sessions.all.find((s) => s.id === SESSION_MOBILE)?.active).toBe(false);
  });

  it('ревокнуті раніше сесії не рахуються повторно (ідемпотентність)', async () => {
    const { sessions, handler } = setup();
    seedSession(sessions, { id: CURRENT, channel: 'web' });
    seedSession(sessions, { id: testId(), channel: 'web', revoked: true });

    const result = await handler.handle({ userId: USER_1, currentSessionId: CURRENT });

    expect(result.revokedCount).toBe(0);
  });

  it('єдиний пристрій — 0 ревоків, але подія все одно пишеться (дія мала місце)', async () => {
    const { sessions, outbox, handler } = setup();
    seedSession(sessions, { id: CURRENT, channel: 'web' });

    const result = await handler.handle({ userId: USER_1, currentSessionId: CURRENT });

    expect(result.revokedCount).toBe(0);
    expect(outbox.events.map((e) => e.type)).toEqual(['identity.sessions.revoked.all']);
  });

  it('пише ОДНУ подію identity.sessions.revoked.all з кількістю і поточною сесією', async () => {
    const { sessions, outbox, handler } = setup();
    seedSession(sessions, { id: CURRENT, channel: 'web' });
    seedSession(sessions, { id: testId(), channel: 'web' });

    await handler.handle({ userId: USER_1, currentSessionId: CURRENT });

    expect(outbox.events).toHaveLength(1);
    expect(outbox.events[0]?.type).toBe('identity.sessions.revoked.all');
    expect(outbox.events[0]?.payload).toEqual({
      userId: USER_1,
      revokedCount: 1,
      exceptSessionId: CURRENT,
    });
  });

  it('ревокнута mobile-сесія не лишає активний refresh: CAS-ротація провалюється', async () => {
    const { sessions, handler } = setup();
    seedSession(sessions, { id: CURRENT, channel: 'web' });
    const { session: mobile } = seedSession(sessions, { id: SESSION_MOBILE, channel: 'mobile' });

    await handler.handle({ userId: USER_1, currentSessionId: CURRENT });

    // Рядок ще резолвиться за refresh-хешем, але сесія вже не активна…
    const found = await sessions.findByRefreshHash(mobile.refreshTokenHash ?? '');
    expect(found?.id).toBe(SESSION_MOBILE);
    expect(found?.active).toBe(false);

    // …і CAS-ротація не проходить — мертвий refresh не обмінюється на нову пару.
    const rotated = await sessions.rotateTokens({
      sessionId: SESSION_MOBILE,
      expectedRefreshHash: mobile.refreshTokenHash ?? '',
      accessHash: 'new-access-hash',
      refreshTokenHash: 'new-refresh-hash',
      accessExpiresAt: new Date(),
      refreshExpiresAt: new Date(),
    });
    expect(rotated).toBe(0);
  });

  it('сесії інших користувачів не зачіпаються', async () => {
    const { sessions, handler } = setup();
    seedSession(sessions, { id: CURRENT, channel: 'web', userId: USER_1 });
    seedSession(sessions, { id: ALIEN, channel: 'web', userId: USER_2 });

    const result = await handler.handle({ userId: USER_1, currentSessionId: CURRENT });

    expect(result.revokedCount).toBe(0);
    expect(sessions.all.find((s) => s.id === ALIEN)?.active).toBe(true);
  });
});
