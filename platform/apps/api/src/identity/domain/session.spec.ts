import { Session } from './session';
import { SESSION_1, USER_1 } from '../application/test-ids';

describe('Session', () => {
  const now = new Date('2026-09-21T10:00:00.000Z');

  it('випускає сесію з tokenHash і без відкликання', () => {
    const session = Session.issue({
      id: SESSION_1,
      userId: USER_1,
      channel: 'web',
      tokenHash: 'abc',
      refreshTokenHash: null,
      previousRefreshHash: null,
      accessExpiresAt: null,
      refreshExpiresAt: null,
      createdAt: now,
    });
    expect(session.channel).toBe('web');
    expect(session.tokenHash).toBe('abc');
    expect(session.refreshTokenHash).toBeNull();
    expect(session.revokedAt).toBeNull();
  });

  it('revoke позначає сесію відкріпленою, idempotent', () => {
    const session = Session.issue({
      id: SESSION_1,
      userId: USER_1,
      channel: 'web',
      tokenHash: 'abc',
      refreshTokenHash: null,
      previousRefreshHash: null,
      accessExpiresAt: null,
      refreshExpiresAt: null,
      createdAt: now,
    });
    expect(session.revoke(now)).toBe(true);
    expect(session.active).toBe(false);
    expect(session.revokedAt).toEqual(now);
    expect(session.revoke(now)).toBe(false);
  });

  it('rotate (T-014): лише з поточного refresh активної сесії; токсичні відхилення — false', () => {
    const session = Session.issue({
      id: SESSION_1,
      userId: USER_1,
      channel: 'mobile',
      tokenHash: 'access-1',
      refreshTokenHash: 'r1',
      previousRefreshHash: null,
      accessExpiresAt: new Date('2026-09-21T10:15:00.000Z'),
      refreshExpiresAt: new Date('2026-10-21T10:00:00.000Z'),
      createdAt: now,
    });
    const next = {
      accessHash: 'access-2',
      refreshTokenHash: 'r2',
      accessExpiresAt: new Date('2026-09-21T10:30:00.000Z'),
      refreshExpiresAt: new Date('2026-10-21T10:00:00.000Z'),
    };

    // Чужий presented-хеш не проходить кас дверей.
    expect(session.rotate(next, 'other')).toBe(false);
    expect(session.refreshTokenHash).toBe('r1');

    // Правильний — ротація: previous <- поточний, нові хеші/TTL.
    expect(session.rotate(next, 'r1')).toBe(true);
    expect(session.previousRefreshHash).toBe('r1');
    expect(session.refreshTokenHash).toBe('r2');
    expect(session.tokenHash).toBe('access-2');
    expect(session.accessExpiresAt).toEqual(new Date('2026-09-21T10:30:00.000Z'));

    // Відкликана сесія не ротується.
    session.revoke(now);
    expect(session.rotate({ ...next, refreshTokenHash: 'r3' }, 'r2')).toBe(false);
  });
});
