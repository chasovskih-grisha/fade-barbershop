// SetClientEmail (T-4422): email для сповіщень безпеки. Адреса унікальна
// (спільна скринька = чужі сповіщення), '' прибирає email (вимкнення
// сповіщень), зміна на ту саму адресу — без події (ідемпотентно).
import { SetClientEmailHandler } from './set-client-email';
import { ClientEmailTakenError, InvalidClientEmailError } from './identity-errors';
// prettier-ignore
import { FakeClock, FakeOutbox, FakeUserRepository, T0, passthroughUow, seedUser } from './client-sessions.fakes';
import { expectRejected } from '@fade/test-utils';
import { USER_1, USER_2 } from './test-ids';

const setup = (email?: string) => {
  const users = new FakeUserRepository();
  const outbox = new FakeOutbox();
  const clock = new FakeClock(T0);
  seedUser(users, email === undefined ? {} : { email });
  const handler = new SetClientEmailHandler({ users, outbox, clock, uow: passthroughUow });
  return { users, outbox, handler };
};

describe('SetClientEmail (T-4422): збереження email сповіщень', () => {
  it('зберігає адресу і пише identity.user.email.changed', async () => {
    const { users, outbox, handler } = setup();

    const result = await handler.handle({ userId: USER_1, email: 'client@example.com' });

    expect(result).toEqual({ ok: true, email: 'client@example.com' });
    expect(users.all[0]?.email).toBe('client@example.com');
    expect(outbox.events.map((e) => e.type)).toEqual(['identity.user.email.changed']);
  });

  it('нормалізує адресу: trim + lowercase', async () => {
    const { users, handler } = setup();

    const result = await handler.handle({ userId: USER_1, email: '  Client@Example.COM ' });

    expect(result.email).toBe('client@example.com');
    expect(users.all[0]?.email).toBe('client@example.com');
  });

  it("'' прибирає email — сповіщення вимкнено, подія з email: null", async () => {
    const { users, outbox, handler } = setup('client@example.com');

    const result = await handler.handle({ userId: USER_1, email: '' });

    expect(result.email).toBeNull();
    expect(users.all[0]?.email).toBeNull();
    expect(outbox.events[0]?.payload).toEqual({ userId: USER_1, email: null });
  });
});

describe('SetClientEmail (T-4422): валідація адреси', () => {
  it.each(['не-пошта', 'a@b', '@x.com', 'a@.com', 'a b@example.com'])(
    'некоректна адреса %s → InvalidClientEmailError',
    async (email) => {
      const { handler } = setup();

      await expectRejected(
        handler.handle({ userId: USER_1, email }),
        InvalidClientEmailError,
        'адреса без домену/крапки або з пробілами — сповіщення не дійдуть'
      );
    }
  );

  it('адреса, зайнята іншим акаунтом → ClientEmailTakenError (без запису і події)', async () => {
    const { users, outbox, handler } = setup();
    seedUser(users, { id: USER_2, email: 'taken@example.com' });

    await expectRejected(
      handler.handle({ userId: USER_1, email: 'taken@example.com' }),
      ClientEmailTakenError,
      'спільна скринька означала б чужі сповіщення про входи'
    );

    expect(users.all.find((u) => u.id === USER_1)?.email).toBeNull();
    expect(outbox.events).toHaveLength(0);
  });

  it('власна поточна адреса повторно — ок, без події (ідемпотентно)', async () => {
    const { outbox, handler } = setup('client@example.com');

    const result = await handler.handle({ userId: USER_1, email: 'client@example.com' });

    expect(result.email).toBe('client@example.com');
    expect(outbox.events).toHaveLength(0);
  });

  it('довжина > 254 (RFC 5321) → InvalidClientEmailError', async () => {
    const { handler } = setup();
    const long = 'a'.repeat(250) + '@example.com';

    await expectRejected(
      handler.handle({ userId: USER_1, email: long }),
      InvalidClientEmailError,
      'занадто довга адреса'
    );
  });
});
