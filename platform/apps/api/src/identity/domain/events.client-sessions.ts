// Події сесій і пристроїв клієнта (T-4422) — окремо від events.ts (гейт
// max-lines); конвенції ті самі, що в events.ts (contracts/events/README.md).

import { DomainEvent } from './events';

/** T-4422: «вийти скрізь» — масова інвалідація сесій користувача (крім
 *  поточної). Одна подія з кількістю: сповіщення на email без дублів. */
export class SessionsRevokedAll extends DomainEvent {
  readonly type = 'identity.sessions.revoked.all';
  readonly payload: { userId: string; revokedCount: number; exceptSessionId: string };

  constructor(
    input: { userId: string; revokedCount: number; exceptSessionId: string },
    occurredAt: Date
  ) {
    super({ occurredAt, aggregateId: input.userId });
    this.payload = input;
  }
}

/** T-4422: клієнт додав/змінив email (джерело сповіщень безпеки). */
export class UserEmailChanged extends DomainEvent {
  readonly type = 'identity.user.email.changed';
  readonly payload: { userId: string; email: string | null };

  constructor(input: { userId: string; email: string | null }, occurredAt: Date) {
    super({ occurredAt, aggregateId: input.userId });
    this.payload = input;
  }
}
