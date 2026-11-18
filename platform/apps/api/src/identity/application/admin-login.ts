// AdminLogin (T-013) — username + password → адмінська сесія. Пароль зберігається
// як scrypt-хеш на User; OTP-контур клієнтів не задіяний. Подія: SessionStarted.
// Журнал входів (T-4411) — ПОЗА транзакцією: транзакція фіксує лише бізнес-стан
// (сесія + outbox); успіх не фіксується для відкоченої операції (uow.run кидає →
// success-запис не пишеться взагалі), невдачі пишуться в catch — вони мають
// переживати відкат (PrismaLoginAudit пише через базовий клієнт).

import { Session, type SessionChannel } from '../domain/session';
import { SessionStarted, type DomainEvent } from '../domain/events';
import { generateToken, hashToken } from '../domain/otp-code';
import { PASSWORD_MIN_LENGTH, passwordMatches } from '../domain/password';
import type { User } from '../domain/user';
import { AdminAccessForbiddenError, AdminInvalidCredentialsError } from './identity-errors';
import type { AdminLoginDeps, AdminLoginInput, AdminLoginResult } from './admin-login.types';

export type { AdminLoginDeps, AdminLoginInput, AdminLoginResult } from './admin-login.types';

export class AdminLoginHandler {
  constructor(private readonly deps: AdminLoginDeps) {}

  /** Невдача креденшлів/доступу → запис у журнал (поза транзакцією). */
  private async recordFailure(username: string, userId: string | null, now: Date): Promise<void> {
    await this.deps.audit.record(userId ?? 'anonymous', {
      ts: now,
      username,
      ok: false,
      actorId: null,
    });
  }

  /** Валідації креденшлів/доступу: адмін або доменна помилка (invalid/forbidden). */
  private async resolveAdmin(
    input: AdminLoginInput,
    known: { value: string | null }
  ): Promise<User> {
    const username = input.username.trim();
    if (username.length < 2 || input.password.length < PASSWORD_MIN_LENGTH)
      throw new AdminInvalidCredentialsError();
    const user = await this.deps.users.findByUsername(username);
    known.value = user?.id ?? null; // userId відомий одразу після пошуку — кільце невдачі
    if (!user || !user.passwordHash || !passwordMatches(user.passwordHash, input.password))
      throw new AdminInvalidCredentialsError();
    // T-4411: деактивований адмін не входить (guard би все одно відхилив сесію).
    if (!user.isAdmin || !user.active) throw new AdminAccessForbiddenError();
    return user;
  }

  async handle(input: AdminLoginInput): Promise<AdminLoginResult> {
    const username = input.username.trim();
    const now = this.deps.clock.now();
    const known: { value: string | null } = { value: null }; // userId відомий після findByUsername
    try {
      const user = await this.resolveAdmin(input, known);

      // --- Транзакція: ЛИШЕ бізнес-стан (сесія + outbox) ---
      const result = await this.deps.uow.run(async () => {
        const token = generateToken();
        const session = Session.issue({
          id: this.deps.ids.id(),
          userId: user.id,
          channel: 'admin',
          tokenHash: hashToken(token),
          refreshTokenHash: null,
          previousRefreshHash: null,
          accessExpiresAt: null,
          refreshExpiresAt: null,
          createdAt: now,
        });
        await this.deps.sessions.save(session);
        const events: DomainEvent[] = [new SessionStarted(session, now)];
        await this.deps.outbox.append(events);
        return {
          token,
          userId: user.id,
          username: user.username ?? username,
          phone: user.phone.value,
          channel: 'admin' as SessionChannel,
        };
      });

      // Журнал: ПІСЛЯ коміту — успіх не фіксується для відкоченої операції.
      await this.deps.audit.record(user.id, { ts: now, username, ok: true, actorId: user.id });
      return result;
    } catch (error) {
      // Невдачі креденшлів/доступу — поза транзакцією (переживають відкат);
      // серверні збої (наприклад, падіння uow) НЕ є невдалим входом — не пишемо,
      // щоб не забруднювати сигнал перебору паролів.
      if (
        error instanceof AdminInvalidCredentialsError ||
        error instanceof AdminAccessForbiddenError
      ) {
        await this.recordFailure(username, known.value, now);
      }
      throw error;
    }
  }
}
