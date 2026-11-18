// ResetAdminPassword — адмін скидає пароль іншому адміну (super-style T-013).
// Закриває всі сесії цілі; цілісна перевірка: ціль — адмін.

import { PasswordChanged } from '../domain/account.events';
import { generateToken } from '../domain/otp-code';
import { hashPassword } from '../domain/password';
import { AdminAccessForbiddenError, AdminNotFoundError } from './identity-errors';
import { revokeAll, type AdminAccountDeps } from './admin-account';

export class ResetAdminPasswordHandler {
  constructor(private readonly deps: AdminAccountDeps) {}

  handle(input: { actorId: string; targetUserId: string }): Promise<{ newPassword: string }> {
    return this.deps.uow.run(async () => {
      const actor = await this.deps.users.findById(input.actorId);
      if (!actor?.isAdmin) throw new AdminAccessForbiddenError();
      const target = await this.deps.users.findById(input.targetUserId);
      if (!target) throw new AdminNotFoundError();
      if (!target.isAdmin) throw new AdminAccessForbiddenError();

      const now = this.deps.clock.now();
      // T-4411: новий пароль одноразовий, передається поза каналом (дзвінок);
      // згенерований (не обраний людиною) — мінімальна довжина гарантована.
      const newPassword = `Fade-${generateToken().slice(0, 8)}!`;
      target.setPassword(hashPassword(newPassword));
      target.setActive(false);
      await this.deps.users.save(target);
      const events = [
        new PasswordChanged({
          userId: target.id,
          actorId: actor.id,
          reason: 'admin_reset',
          occurredAt: now,
        }),
        ...(await revokeAll(this.deps, target.id, now)),
      ];
      await this.deps.outbox.append(events);
      return { newPassword };
    });
  }
}
