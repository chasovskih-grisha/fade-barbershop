import { Session } from './session';
import { SESSION_1, SESSION_2, USER_1 } from '../application/test-ids';

describe('Session accessValid & reconstitute', () => {
  const now = new Date('2026-09-21T10:00:00.000Z');

  it('accessValid (T-014): активна з ненулевим майбутнім expiry; без expiry — false', () => {
    const mobile = Session.issue({
      id: SESSION_1,
      userId: USER_1,
      channel: 'mobile',
      tokenHash: 'a',
      refreshTokenHash: 'r',
      previousRefreshHash: null,
      accessExpiresAt: new Date('2026-09-21T10:15:00.000Z'),
      refreshExpiresAt: new Date('2026-10-21T10:00:00.000Z'),
      createdAt: now,
    });
    expect(mobile.accessValid(new Date('2026-09-21T10:14:59.000Z'))).toBe(true);
    expect(mobile.accessValid(new Date('2026-09-21T10:15:01.000Z'))).toBe(false);

    // Web/admin: expiry null — accessValid завжди false (cookie-тракт).
    const web = Session.issue({
      id: SESSION_2,
      userId: USER_1,
      channel: 'web',
      tokenHash: 'b',
      refreshTokenHash: null,
      previousRefreshHash: null,
      accessExpiresAt: null,
      refreshExpiresAt: null,
      createdAt: now,
    });
    expect(web.accessValid(now)).toBe(false);
  });

  it('reconstitute відтворює стан із БД', () => {
    const session = Session.reconstitute({
      id: SESSION_1,
      userId: USER_1,
      channel: 'mobile',
      tokenHash: 'abc',
      refreshTokenHash: 'def',
      previousRefreshHash: null,
      accessExpiresAt: new Date('2026-09-21T10:15:00.000Z'),
      refreshExpiresAt: new Date('2026-10-21T10:00:00.000Z'),
      createdAt: new Date('2026-09-21T10:00:00.000Z'),
      revokedAt: new Date('2026-09-21T11:00:00.000Z'),
    });
    expect(session.active).toBe(false);
    expect(session.refreshTokenHash).toBe('def');
    expect(session.revokedAt?.toISOString()).toBe('2026-09-21T11:00:00.000Z');
  });
});
