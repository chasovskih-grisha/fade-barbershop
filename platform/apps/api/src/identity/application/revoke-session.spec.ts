// RevokeSessionHandler (T-014/T-4411): відкликання однієї сесії за сирим
// токеном — модель + подія SessionRevoked. Ідемпотентно: невідома або вже
// відкликана сесія → ok без події. Фейки — спільні identity-фейки портів.
import { RevokeSessionHandler } from './revoke-session';
import { Session } from '../domain/session';
import { hashToken } from '../domain/otp-code';
import { SessionRevoked } from '../domain/events';
import { FakeClock, FakeOutbox, FakeSessionRepository, passthroughUow } from './ports.fakes';
import { SESSION_1, USER_1 } from './test-ids';

const T0 = new Date('2026-09-21T10:00:00.000Z');
const TOKEN = 'raw-token-value';

/** Web-сесія з відомим сирим токеном; revoked — уже відкликана. */
function session(revoked = false): Session {
  const created = Session.issue({
    id: SESSION_1,
    userId: USER_1,
    channel: 'web',
    tokenHash: hashToken(TOKEN),
    refreshTokenHash: null,
    previousRefreshHash: null,
    accessExpiresAt: null,
    refreshExpiresAt: null,
    createdAt: T0,
  });
  if (revoked) created.revoke(T0);
  return created;
}

function setup(seed: Session | null) {
  const sessions = new FakeSessionRepository();
  if (seed) sessions.save(seed);
  const outbox = new FakeOutbox();
  const handler = new RevokeSessionHandler({
    sessions,
    outbox,
    clock: new FakeClock(T0.toISOString()),
    uow: passthroughUow,
  });
  return { sessions, outbox, handler };
}

describe('RevokeSessionHandler', () => {
  it('відкликає активну сесію, зберігає модель і пише подію SessionRevoked', async () => {
    const { sessions, outbox, handler } = setup(session());

    const result = await handler.handle({ token: TOKEN });

    expect(result).toEqual({ ok: true, revoked: true });
    expect((await sessions.findByTokenHash(hashToken(TOKEN)))?.active).toBe(false);
    expect(outbox.events[0]).toBeInstanceOf(SessionRevoked);
  });

  it('невідома сесія — idempotent ok без події', async () => {
    const { outbox, handler } = setup(null);

    await expect(handler.handle({ token: TOKEN })).resolves.toEqual({ ok: true, revoked: false });
    expect(outbox.events).toEqual([]);
  });

  it('вже відкликана сесія — idempotent ok без події', async () => {
    const { outbox, handler } = setup(session(true));

    await expect(handler.handle({ token: TOKEN })).resolves.toEqual({ ok: true, revoked: false });
    expect(outbox.events).toEqual([]);
  });
});
