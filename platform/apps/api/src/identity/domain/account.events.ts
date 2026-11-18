// Події життєвого циклу адмін-обліковки (T-4411) — окремий файл за гейтом
// max-lines; конвенції ті самі, що в events.ts (contracts/events/README.md).

import { DomainEvent } from './events';

/** Пароль адміна змінено: власна зміна або скидання іншим адміном.
 * payload НЕ містить хеша — тільки хто і чию обліковку. */
export class PasswordChanged extends DomainEvent {
  readonly type = 'identity.password.changed';
  readonly payload: { userId: string; actorId: string; reason: 'self_change' | 'admin_reset' };

  constructor(params: {
    userId: string;
    actorId: string;
    reason: 'self_change' | 'admin_reset';
    occurredAt: Date;
  }) {
    super({ occurredAt: params.occurredAt, aggregateId: params.userId });
    this.payload = { userId: params.userId, actorId: params.actorId, reason: params.reason };
  }
}

/** Адмін-акаунт деактивовано (блокування, «при звільненні»). Активація —
 * тихий стан, без події (ідемпотентність ревоків не залежить від неї). */
export class AdminDeactivated extends DomainEvent {
  readonly type = 'identity.admin.deactivated';
  readonly payload: { userId: string; actorId: string; active: boolean };

  constructor(params: { userId: string; actorId: string; active: boolean; occurredAt: Date }) {
    super({ occurredAt: params.occurredAt, aggregateId: params.userId });
    this.payload = { userId: params.userId, actorId: params.actorId, active: params.active };
  }
}
