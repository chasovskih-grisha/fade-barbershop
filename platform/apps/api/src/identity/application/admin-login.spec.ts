import { AdminLoginHandler } from './admin-login';
// prettier-ignore
import { FakeClock, FakeOutbox, FakeSessionRepository, FakeUserRepository, UuidIds, passthroughUow } from './ports.fakes';
import { FakeLoginAudit } from './login-audit.fakes';
import { AdminAccessForbiddenError, AdminInvalidCredentialsError } from './identity-errors';
import { hashPassword } from '../domain/password';
import { User } from '../domain/user';
import { PhoneNumber } from '../domain/phone-number';
import { testId } from './test-ids';

const T0 = new Date('2026-09-21T10:00:00.000Z');

function setup() {
  const clock = new FakeClock(T0.toISOString());
  const users = new FakeUserRepository();
  const sessions = new FakeSessionRepository();
  const outbox = new FakeOutbox();
  const audit = new FakeLoginAudit();
  const handler = new AdminLoginHandler({
    users,
    sessions,
    outbox,
    clock,
    ids: new UuidIds(),
    uow: passthroughUow,
    audit,
  });
  return { handler, users, sessions, outbox, audit };
}

function admin(username = 'owner', password = 'FadeSecret2026'): User {
  return User.create({
    id: testId(),
    phone: PhoneNumber.of('+380000000001'),
    role: 'admin',
    username,
    passwordHash: hashPassword(password),
    createdAt: T0,
  });
}

describe('AdminLoginHandler', () => {
  it('успіх: вірні username + password → сесія admin і подія', async () => {
    const { handler, users, sessions, outbox } = setup();
    users.save(admin());

    const result = await handler.handle({ username: 'owner', password: 'FadeSecret2026' });

    expect(result.token).toHaveLength(64);
    expect(result.channel).toBe('admin');
    expect(sessions.all).toHaveLength(1);
    expect(sessions.all[0]?.channel).toBe('admin');
    expect(outbox.events.map((e) => e.type)).toEqual(['identity.session.started']);
  });

  it.each([
    ['невірний пароль', { username: 'owner', password: 'WrongPass789' }],
    ['невідомий username (не світимо різницю)', { username: 'nobody', password: 'FadeSecret2026' }],
    ['короткий username', { username: 'a', password: 'FadeSecret2026' }],
    ['короткий пароль', { username: 'owner', password: 'short' }],
  ])('%s → AdminInvalidCredentialsError', async (_name, creds) => {
    const { handler, users } = setup();
    users.save(admin());
    await expect(handler.handle(creds)).rejects.toBeInstanceOf(AdminInvalidCredentialsError);
  });

  it('акаунт є, але не admin → AdminAccessForbiddenError', async () => {
    const { handler, users } = setup();
    users.save(
      User.create({
        id: testId(),
        phone: PhoneNumber.of('+380501234567'),
        role: 'client',
        username: 'myself',
        passwordHash: hashPassword('FadeSecret2026'),
        createdAt: T0,
      })
    );
    await expect(
      handler.handle({ username: 'myself', password: 'FadeSecret2026' })
    ).rejects.toBeInstanceOf(AdminAccessForbiddenError);
  });
});
