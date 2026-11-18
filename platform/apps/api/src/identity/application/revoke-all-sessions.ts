// RevokeAllSessions (T-4422): «вийти скрізь» — інвалідація всіх активних
// клієнтських сесій, ОКРІМ поточної (пристрій, з якого натиснули, лишається
// живим — інакше користувач одразу викидається з кабінету). Mobile-сесії
// втрачають і access, і refresh (ревокований refresh → 401 на ротації;
// reuse-детект T-014 на ревокованій сесії не підіймає її назад).
// Подія identity.sessions.revoked.all — одна на дію: сповіщення на email
// без дублів (журнал notifications читає eventId, патерн T-042c).

import type { DomainEvent } from '../domain/events';
import { SessionsRevokedAll } from '../domain/events.client-sessions';
import type { Clock, SessionRepository, UnitOfWork } from '../domain/ports';

export interface RevokeAllSessionsResult {
  /** Скільки інших активних сесій закрито (0 — клієнт мав один пристрій). */
  revokedCount: number;
}

export class RevokeAllSessionsHandler {
  constructor(
    private readonly deps: {
      sessions: SessionRepository;
      outbox: { append(events: readonly DomainEvent[]): Promise<void> };
      clock: Clock;
      uow: UnitOfWork;
    }
  ) {}

  handle(input: { userId: string; currentSessionId: string }): Promise<RevokeAllSessionsResult> {
    const { sessions, outbox, clock, uow } = this.deps;
    return uow.run(async (): Promise<RevokeAllSessionsResult> => {
      const now = clock.now();
      const active = await sessions.findActiveByUser(input.userId);
      const others = active.filter((session) => session.id !== input.currentSessionId);
      let revokedCount = 0;
      for (const session of others) {
        if (session.revoke(now)) {
          await sessions.save(session);
          revokedCount += 1;
        }
      }
      await outbox.append([
        new SessionsRevokedAll(
          { userId: input.userId, revokedCount, exceptSessionId: input.currentSessionId },
          now
        ),
      ]);
      return { revokedCount };
    });
  }
}
