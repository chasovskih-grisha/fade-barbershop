// Спеки T-4411: скидання пароля адміну. Ризик — інвалідація сесій.
import { ResetAdminPasswordHandler } from './reset-admin-password';
import { AdminAccessForbiddenError, AdminNotFoundError } from './identity-errors';
import { adminUser, expectError, harness } from './admin-account.fakes';
import { uuidv7 } from '@fade/domain-shared';

const BOSS = uuidv7();
const TARGET = uuidv7();
const CLIENT = uuidv7();
const GHOST = uuidv7();

describe('ResetAdminPassword (ризик T-4411: інвалідація сесій)', () => {
  it('скидає: пароль у відповіді (НЕ в outbox), ціль деактивована, 2 сесії закриті', async () => {
    const h = harness();
    h.users.set(BOSS, adminUser(BOSS));
    h.users.set(TARGET, adminUser(TARGET));
    const { newPassword } = await new ResetAdminPasswordHandler(h.deps).handle({
      actorId: BOSS,
      targetUserId: TARGET,
    });
    expect(newPassword).toMatch(/^Fade-/);
    expect(h.revoked).toEqual([TARGET]);
    expect(JSON.stringify(h.events)).not.toContain(newPassword);
    expect(h.users.get(TARGET)?.active).toBe(false);
  });

  it('гілки: не-адмін ціль → 403, зникла → 404, не-адмін актор → 403', async () => {
    const h = harness();
    h.users.set(BOSS, adminUser(BOSS));
    h.users.set(CLIENT, adminUser(CLIENT, 'client'));
    const handler = new ResetAdminPasswordHandler(h.deps);
    await expectError(
      handler.handle({ actorId: BOSS, targetUserId: CLIENT }),
      AdminAccessForbiddenError
    );
    await expectError(handler.handle({ actorId: BOSS, targetUserId: GHOST }), AdminNotFoundError);
    await expectError(
      handler.handle({ actorId: CLIENT, targetUserId: BOSS }),
      AdminAccessForbiddenError
    );
  });
});
