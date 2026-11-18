// AdminAccount (T-4411): життєвий цикл адмін-обліковки.
// 1) ChangeOwnPassword — адмін міняє свій пароль (поточний підтверджується);
// 2) ResetAdminPassword — адмін скидає пароль іншому адміну (новий одноразовий
//    у відповіді; передача поза каналом — наприклад, дзвінок);
// 3) SetAdminActive — блокування/розблокування («при звільненні»).
// Після зміни/скидання/блокування — revokeAllForUser: старі куки мертві
// (ризик зі спеки T-4411, тест обов'язковий). Події: PasswordChanged,
// AdminDeactivated. Зміна СВОЄГО пароля НЕ інвалідує поточну сесію.

import { SessionRevoked, type DomainEvent } from '../domain/events';
import { PasswordChanged } from '../domain/account.events';
import { PASSWORD_MIN_LENGTH, hashPassword, passwordMatches } from '../domain/password';
import type {
  Clock,
  IdGenerator,
  LoginAudit,
  Outbox,
  SessionRepository,
  UnitOfWork,
  UserRepository,
} from '../domain/ports';
import {
  AdminAccessForbiddenError,
  AdminInvalidCredentialsError,
  UserNotFoundError,
} from './identity-errors';

export interface AdminAccountDeps {
  users: UserRepository;
  sessions: SessionRepository;
  outbox: Outbox;
  clock: Clock;
  ids: IdGenerator;
  uow: UnitOfWork;
  audit: LoginAudit;
}

export const assertValidPassword = (password: string): void => {
  if (password.length < PASSWORD_MIN_LENGTH) throw new AdminInvalidCredentialsError();
};

/** Спільна частина: події ревоків сесій користувача. */
export async function revokeAll(
  deps: AdminAccountDeps,
  userId: string,
  now: Date
): Promise<DomainEvent[]> {
  const closed = await deps.sessions.revokeAllForUser(userId, now);
  return Array.from(
    { length: closed },
    (_, i) => new SessionRevoked({ id: `bulk:${userId}:${i}`, userId }, now)
  );
}

/** ChangeOwnPassword — адмін міняє власний пароль. Поточна сесія живе. */
export class ChangeOwnPasswordHandler {
  constructor(private readonly deps: AdminAccountDeps) {}

  handle(input: {
    actorId: string;
    currentPassword: string;
    newPassword: string;
  }): Promise<{ changedAt: string }> {
    return this.deps.uow.run(async () => {
      assertValidPassword(input.newPassword);
      const user = await this.deps.users.findById(input.actorId);
      if (!user) throw new UserNotFoundError();
      if (!user.isAdmin) throw new AdminAccessForbiddenError();
      if (!user.passwordHash || !passwordMatches(user.passwordHash, input.currentPassword)) {
        await this.deps.audit.record(user.id, {
          ts: this.deps.clock.now(),
          username: user.username ?? user.id,
          ok: false,
          actorId: user.id,
        });
        throw new AdminInvalidCredentialsError();
      }
      const now = this.deps.clock.now();
      user.setPassword(hashPassword(input.newPassword));
      await this.deps.users.save(user);
      await this.deps.outbox.append([
        new PasswordChanged({
          userId: user.id,
          actorId: user.id,
          reason: 'self_change',
          occurredAt: now,
        }),
      ]);
      return { changedAt: now.toISOString() };
    });
  }
}
