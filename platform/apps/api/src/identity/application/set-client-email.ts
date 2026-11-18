// SetClientEmail (T-4422): клієнт зберігає email для сповіщень безпеки
// (новий вхід на іншому пристрої, «вийти скрізь»). ADR 0005: вхід по
// телефону — email у логін не задіяний, тому верифікація адреси v1 не потрібна
// (зловмисник може тільки «вимкнути собі сповіщення», зайнявши адресу —
// оповіщення про це йде на попередню адресу при зміні; верифікація листом —
// коли з'явиться розсилка). Адреса унікальна: спільна скринька = чужі
// сповіщення. '' — прибрати email (вимкнути сповіщення).

import type { DomainEvent } from '../domain/events';
import { UserEmailChanged } from '../domain/events.client-sessions';
import type { Clock, Outbox, UnitOfWork, UserRepository } from '../domain/ports';
import { ClientEmailTakenError, InvalidClientEmailError } from './identity-errors';

const EMAIL_MAX = 254; // RFC 5321
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface SetClientEmailResult {
  ok: true;
  email: string | null;
}

export class SetClientEmailHandler {
  constructor(
    private readonly deps: {
      users: UserRepository;
      outbox: Outbox;
      clock: Clock;
      uow: UnitOfWork;
    }
  ) {}

  handle(input: { userId: string; email: string }): Promise<SetClientEmailResult> {
    const { users, outbox, clock, uow } = this.deps;
    return uow.run(async (): Promise<SetClientEmailResult> => {
      const raw = input.email.trim().toLowerCase();
      const email = raw.length === 0 ? null : raw;
      if (email !== null) {
        if (email.length > EMAIL_MAX || !EMAIL_RE.test(email)) throw new InvalidClientEmailError();
        const taken = await users.findByEmail(email);
        if (taken && taken.id !== input.userId) throw new ClientEmailTakenError();
      }
      const user = await users.findById(input.userId);
      if (!user) throw new ClientNotFoundError();
      if (user.changeEmail(email)) {
        await users.save(user);
        const events: DomainEvent[] = [
          new UserEmailChanged({ userId: user.id, email }, clock.now()),
        ];
        await outbox.append(events);
      }
      return { ok: true, email: user.email };
    });
  }
}

// Сесійна помилка (не IdentityError — клієнтська сесія завжди є до цього
// кейсу; перевірка на всяк випадок, щоб не падати на undefined).
export class ClientNotFoundError extends Error {
  constructor() {
    super('ClientNotFoundError');
    this.name = 'ClientNotFoundError';
  }
}
