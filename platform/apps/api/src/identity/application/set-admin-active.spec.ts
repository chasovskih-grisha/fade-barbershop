// Спеки T-4411: блокування/розблокування адміна. Ризик — інвалідація сесій.
import { SetAdminActiveHandler } from './set-admin-active';
import { ListLoginAuditHandler } from './list-login-audit';
import { AdminAccessForbiddenError, AdminNotFoundError } from './identity-errors';
import { adminUser, expectError, harness, NOW } from './admin-account.fakes';
import { Session } from '../domain/session';
import { testId } from './test-ids';
import { uuidv7 } from '@fade/domain-shared';

const BOSS = uuidv7();
const TARGET = uuidv7();
const PLEB = uuidv7();
const GHOST = uuidv7();

const AUDIT_ID = testId();

describe('SetAdminActive (ризик T-4411: інвалідація сесій)', () => {
  it('блокування: active=false, 2 сесії закриті, події deactivate + revoked×2', async () => {
    const h = harness();
    h.users.set(BOSS, adminUser(BOSS));
    h.users.set(TARGET, adminUser(TARGET));
    const result = await new SetAdminActiveHandler(h.deps).handle({
      actorId: BOSS,
      targetUserId: TARGET,
      active: false,
    });
    expect(result).toEqual({ active: false, closedSessions: 2 });
    expect(h.users.get(TARGET)?.active).toBe(false);
    expect(h.events.map((e) => e.type)).toEqual([
      'identity.admin.deactivated',
      'identity.session.revoked',
      'identity.session.revoked',
    ]);
  });

  it('розблокування тихе; guard-гілки: актор/ціль', async () => {
    const h = harness();
    h.users.set(BOSS, adminUser(BOSS));
    h.users.set(TARGET, adminUser(TARGET));
    h.users.set(PLEB, adminUser(PLEB, 'client'));
    const target = h.users.get(TARGET);
    if (!target) throw new Error('target missing');
    target.setActive(false);
    const handler = new SetAdminActiveHandler(h.deps);
    expect(await handler.handle({ actorId: BOSS, targetUserId: TARGET, active: true })).toEqual({
      active: true,
      closedSessions: 0,
    });
    expect(h.events).toEqual([]);
    await expectError(
      handler.handle({ actorId: PLEB, targetUserId: BOSS, active: false }),
      AdminAccessForbiddenError
    );
    await expectError(
      handler.handle({ actorId: BOSS, targetUserId: GHOST, active: false }),
      AdminNotFoundError
    );
  });
});

describe('ListLoginAudit і revoke-ідемпотентність', () => {
  it('handler — passthrough; revoke закритої сесії → false', async () => {
    const h = harness();
    (h.deps.audit as unknown as { rows: unknown[] }).rows.push(
      { userId: AUDIT_ID, ts: NOW, username: 'owner', ok: false, actorId: null },
      { userId: AUDIT_ID, ts: NOW, username: 'owner', ok: true, actorId: AUDIT_ID }
    );
    const result = await new ListLoginAuditHandler(h.deps.audit).handle({ userId: AUDIT_ID });
    expect(result.entries.map((e) => e.ok)).toEqual([false, true]);
    const session = Session.issue({
      id: testId(),
      userId: AUDIT_ID,
      channel: 'admin',
      tokenHash: 'h',
      refreshTokenHash: null,
      previousRefreshHash: null,
      accessExpiresAt: null,
      refreshExpiresAt: null,
      createdAt: NOW,
    });
    session.revoke(NOW);
    expect(session.revoke(NOW)).toBe(false);
  });
});
