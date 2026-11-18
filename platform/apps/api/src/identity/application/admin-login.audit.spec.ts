// Аудит-гарантії AdminLogin (T-4411): журнал ПОЗА транзакцією — успіх пишеться лише після
// коміту uow (відкат → success-запису немає), невдачі — в кільце відомого користувача.
import { FakeLoginAudit } from './login-audit.fakes';
import { FakeSessionRepository, passthroughUow } from './ports.fakes';
import { AdminAccessForbiddenError, AdminInvalidCredentialsError } from './identity-errors';
import { hashPassword } from '../domain/password';
import { User } from '../domain/user';
import { PhoneNumber } from '../domain/phone-number';
import type { UnitOfWork } from '../domain/ports';
import { ADMIN_ID, base, T0 } from './admin-login.audit.fakes';
import { testId } from './test-ids';

const CLIENT_ID = testId();

describe('AdminLoginHandler — аудит поза транзакцією (T-4411)', () => {
  it('успіх: журнал пишеться ПІСЛЯ uow (порядок: uow:start → uow:commit → audit:ok)', async () => {
    const order: string[] = [];
    const uow: UnitOfWork = {
      run: (work) => (order.push('uow:start'), work().then((r) => (order.push('uow:commit'), r))),
    };
    const spy = new FakeLoginAudit();
    spy.record = (userId, attempt) => {
      order.push(`audit:${attempt.ok ? 'ok' : 'fail'}`);
      return FakeLoginAudit.prototype.record.call(spy, userId, attempt);
    };
    const { handler } = base(spy, uow);
    await handler.handle({ username: 'owner', password: 'FadeSecret2026' });
    expect(order).toEqual(['uow:start', 'uow:commit', 'audit:ok']);
  });

  it('відкат uow → success-запис у журналі не зявляється (головна гарантія)', async () => {
    const audit = new FakeLoginAudit();
    const { handler } = base(audit, { run: () => Promise.reject(new Error('tx rolled back')) });
    await expect(handler.handle({ username: 'owner', password: 'FadeSecret2026' })).rejects.toThrow(
      'tx rolled back'
    );
    expect(audit.rows).toHaveLength(0); // серверний збій ≠ невдалий вхід
  });

  it('падіння sessions.save всередині транзакції → журнал не забруднений', async () => {
    const sessions = new FakeSessionRepository();
    sessions.save = jest.fn(() => Promise.reject(new Error('db constraint')));
    const audit = new FakeLoginAudit();
    const { handler } = base(audit, { run: (work) => work() }, sessions);
    await expect(handler.handle({ username: 'owner', password: 'FadeSecret2026' })).rejects.toThrow(
      'db constraint'
    );
    expect(audit.rows).toHaveLength(0);
  });

  it('невдача відомого користувача → запис у ЙОГО кільці журналу, не anonymous', async () => {
    const audit = new FakeLoginAudit();
    const { handler, users } = base(audit, passthroughUow);
    await expect(
      handler.handle({ username: 'owner', password: 'WrongPass789' })
    ).rejects.toBeInstanceOf(AdminInvalidCredentialsError);
    expect(audit.rows).toHaveLength(1);
    expect(audit.rows[0]).toMatchObject({ userId: ADMIN_ID, username: 'owner', ok: false });
    // Відомий користувач, але не адмін:
    users.save(
      User.create({
        id: CLIENT_ID,
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
    expect(audit.rows).toHaveLength(2);
    expect(audit.rows[1]?.userId).toBe(CLIENT_ID);
    await expect(
      handler.handle({ username: 'nobody', password: 'FadeSecret2026' })
    ).rejects.toBeInstanceOf(AdminInvalidCredentialsError);
    expect(audit.rows).toHaveLength(3);
    expect(audit.rows[2]?.userId).toBe('anonymous');
  });
});
