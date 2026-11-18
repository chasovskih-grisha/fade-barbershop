// Події сесій (ADR 0005/0017, T-014) — окремо від events.ts (гейт max-lines);
// конвенції ті самі, що в events.ts (contracts/events/README.md).
import { DomainEvent } from './events';

export class SessionStarted extends DomainEvent {
  readonly type = 'identity.session.started';
  readonly payload: { sessionId: string; userId: string; channel: string };

  constructor(session: { id: string; userId: string; channel: string }, occurredAt: Date) {
    super({ occurredAt, aggregateId: session.userId });
    this.payload = { sessionId: session.id, userId: session.userId, channel: session.channel };
  }
}

export class SessionRevoked extends DomainEvent {
  readonly type = 'identity.session.revoked';
  readonly payload: { sessionId: string; userId: string };

  constructor(session: { id: string; userId: string }, occurredAt: Date) {
    super({ occurredAt, aggregateId: session.userId });
    this.payload = { sessionId: session.id, userId: session.userId };
  }
}

/** T-014: ротація пари токенів mobile-сесії (access + refresh). */
export class SessionRefreshed extends DomainEvent {
  readonly type = 'identity.session.refreshed';
  readonly payload: { sessionId: string; userId: string; channel: string };

  constructor(session: { id: string; userId: string; channel: string }, occurredAt: Date) {
    super({ occurredAt, aggregateId: session.userId });
    this.payload = { sessionId: session.id, userId: session.userId, channel: session.channel };
  }
}
