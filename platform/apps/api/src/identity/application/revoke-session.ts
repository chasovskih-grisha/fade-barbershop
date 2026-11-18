// RevokeSession — інвалідує сесію (logout скрізь усі хости). Джерело правди — identity:
// токен hash-ується і шукається в БД; при знаходженні сесія позначається revokedAt,
// подія SessionRevoked додається в outbox. idempotent: відсутність сесії або вже
// відкріплена — повертає ok без помилки (cookie може застаріти на іншому хості).

import { SessionRevoked, type DomainEvent } from '../domain/events';
import { hashToken } from '../domain/otp-code';
import type { Clock, Outbox, SessionRepository, UnitOfWork } from '../domain/ports';

export interface RevokeSessionInput {
  token: string;
}

export interface RevokeSessionDeps {
  sessions: SessionRepository;
  outbox: Outbox;
  clock: Clock;
  uow: UnitOfWork;
}

export interface RevokeSessionOutcome {
  ok: boolean;
  revoked: boolean;
}

export class RevokeSessionHandler {
  constructor(private readonly deps: RevokeSessionDeps) {}

  handle(input: RevokeSessionInput): Promise<RevokeSessionOutcome> {
    const { sessions, outbox, clock, uow } = this.deps;
    return uow.run(async (): Promise<RevokeSessionOutcome> => {
      const session = await sessions.findByTokenHash(hashToken(input.token));
      if (!session) return { ok: true, revoked: false };
      const now = clock.now();
      if (!session.revoke(now)) return { ok: true, revoked: false };

      await sessions.save(session);
      const events: DomainEvent[] = [
        new SessionRevoked({ id: session.id, userId: session.userId }, now),
      ];
      await outbox.append(events);
      return { ok: true, revoked: true };
    });
  }
}
