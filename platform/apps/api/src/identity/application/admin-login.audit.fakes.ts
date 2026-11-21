// Хелпери аудит-спек AdminLogin (T-4411) — окремо від спеки (max-lines).
import { AdminLoginHandler } from './admin-login';
import {
  FakeClock,
  FakeOutbox,
  FakeSessionRepository,
  FakeUserRepository,
  UuidIds,
} from './ports.fakes';
import { FakeLoginAudit } from './login-audit.fakes';
import { hashPassword } from '../domain/password';
import { User } from '../domain/user';
import { PhoneNumber } from '../domain/phone-number';
import type { UnitOfWork } from '../domain/ports';
import { testId } from './test-ids';

export const ADMIN_ID = testId();

export const T0 = new Date('2026-09-21T10:00:00.000Z');

export function admin(): User {
  return User.create({
    id: ADMIN_ID,
    phone: PhoneNumber.of('+380000000001'),
    role: 'admin',
    username: 'owner',
    passwordHash: hashPassword('FadeSecret2026'),
    createdAt: T0,
  });
}

export function base(
  audit: FakeLoginAudit,
  uow: UnitOfWork,
  sessions = new FakeSessionRepository()
) {
  const users = new FakeUserRepository();
  users.save(admin());
  const handler = new AdminLoginHandler({
    users,
    sessions,
    outbox: new FakeOutbox(),
    clock: new FakeClock(T0.toISOString()),
    ids: new UuidIds(),
    uow,
    audit,
  });
  return { handler, sessions, users };
}
