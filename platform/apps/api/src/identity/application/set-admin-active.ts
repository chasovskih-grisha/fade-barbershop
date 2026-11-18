// SetAdminActive — блокування/розблокування адмін-акаунта. Ідемпотентно;
// блокування закриває активні сесії, розблокування — ні.

import { type DomainEvent } from '../domain/events';
import { AdminDeactivated } from '../domain/account.events';
import { AdminAccessForbiddenError, AdminNotFoundError } from './identity-errors';
import { revokeAll, type AdminAccountDeps } from './admin-account';

export class SetAdminActiveHandler {
  constructor(private readonly deps: AdminAccountDeps) {}

  handle(input: {
    actorId: string;
    targetUserId: string;
    active: boolean;
  }): Promise<{ active: boolean; closedSessions: number }> {
    return this.deps.uow.run(async () => {
      const actor = await this.deps.users.findById(input.actorId);
      if (!actor?.isAdmin) throw new AdminAccessForbiddenError();
      const target = await this.deps.users.findById(input.targetUserId);
      if (!target) throw new AdminNotFoundError();
      if (!target.isAdmin) throw new AdminAccessForbiddenError();

      const now = this.deps.clock.now();
      let closedSessions = 0;
      const events: DomainEvent[] = [];
      // Подія — тільки на деактивацію; активація — тихий стан.
      if (!input.active && target.setActive(false)) {
        events.push(
          new AdminDeactivated({
            userId: target.id,
            actorId: actor.id,
            active: false,
            occurredAt: now,
          })
        );
      } else if (input.active) target.setActive(true);
      if (!input.active) {
        const revokeEvents = await revokeAll(this.deps, target.id, now);
        closedSessions = revokeEvents.length;
        events.push(...revokeEvents);
      }
      await this.deps.users.save(target);
      await this.deps.outbox.append(events);
      return { active: target.active, closedSessions };
    });
  }
}
