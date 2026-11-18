// ListClientSessions (T-4422): активні web/mobile сесії — «пристрої» кабінету.
// Поточний пристрій позначає сервер (за сесією запиту); admin-канал не
// показується (ADR 0017 — ізольована адмінська сесія); ревокнуті не видно.
import { ListClientSessionsHandler } from './list-client-sessions';
import {
  FakeSessionRepository,
  FakeUserRepository,
  seedSession,
  seedUser,
} from './client-sessions.fakes';
import {
  SESSION_LIVE,
  SESSION_MINE,
  SESSION_MOBILE,
  SESSION_WEB,
  USER_1,
  USER_2,
  testId,
} from './test-ids';

const setup = () => {
  const sessions = new FakeSessionRepository();
  const users = new FakeUserRepository();
  seedUser(users);
  const handler = new ListClientSessionsHandler(sessions);
  return { sessions, users, handler };
};

describe('ListClientSessions (T-4422): список активних сесій', () => {
  it('показує всі активні сесії; поточна позначена current: true', async () => {
    const { sessions, handler } = setup();
    seedSession(sessions, { id: SESSION_WEB, channel: 'web' });
    seedSession(sessions, { id: SESSION_MOBILE, channel: 'mobile' });
    seedSession(sessions, { id: testId(), channel: 'web' });

    const result = await handler.handle({ userId: USER_1, currentSessionId: SESSION_MOBILE });

    expect(result.sessions).toHaveLength(3);
    expect(result.sessions.find((s) => s.id === SESSION_MOBILE)).toMatchObject({
      channel: 'mobile',
      current: true,
    });
    expect(result.sessions.filter((s) => !s.current)).toHaveLength(2);
  });

  it('admin-сесію не показує (клієнтські пристрої — web/mobile)', async () => {
    const { sessions, handler } = setup();
    seedSession(sessions, { id: SESSION_WEB, channel: 'web' });
    seedSession(sessions, { id: testId(), channel: 'admin' });

    const result = await handler.handle({ userId: USER_1, currentSessionId: SESSION_WEB });

    expect(result.sessions.map((s) => s.id)).toEqual([SESSION_WEB]);
  });

  it('ревокнуті сесії не потрапляють у список', async () => {
    const { sessions, handler } = setup();
    seedSession(sessions, { id: SESSION_LIVE, channel: 'web' });
    seedSession(sessions, { id: testId(), channel: 'web', revoked: true });

    const result = await handler.handle({ userId: USER_1, currentSessionId: SESSION_LIVE });

    expect(result.sessions.map((s) => s.id)).toEqual([SESSION_LIVE]);
  });

  it('сесії іншого користувача не змішуются (ізоляція за userId)', async () => {
    const { sessions, handler } = setup();
    seedSession(sessions, { id: SESSION_MINE, channel: 'web', userId: USER_1 });
    seedSession(sessions, { id: testId(), channel: 'web', userId: USER_2 });

    const result = await handler.handle({ userId: USER_1, currentSessionId: SESSION_MINE });

    expect(result.sessions.map((s) => s.id)).toEqual([SESSION_MINE]);
  });

  it('невідомий поточний sessionId — просто без current, без помилки', async () => {
    const { sessions, handler } = setup();
    seedSession(sessions, { id: SESSION_WEB, channel: 'web' });

    const result = await handler.handle({ userId: USER_1, currentSessionId: testId() });

    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0]?.current).toBe(false);
  });

  it('без активних сесій — порожній список', async () => {
    const { handler } = setup();

    const result = await handler.handle({ userId: USER_1, currentSessionId: testId() });

    expect(result).toEqual({ sessions: [] });
  });
});
