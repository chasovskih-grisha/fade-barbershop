// Специфікація owner-подання журналу входів (T-4411 read-side): злиття
// per-admin кілець, сортування новіші-першими, зріз limit, фільтр за
// користувачем, м'яка відмова від недоступного кільця.
import { ListAllAdminLoginsHandler } from './list-login-audit';
import { uuidv7 } from '@fade/domain-shared';

const ADMIN_1 = uuidv7();
const ADMIN_2 = uuidv7();

const adminIds = [ADMIN_1, ADMIN_2];
const makeAudit = (
  data: Record<string, Array<{ ts: Date; username: string; ok: boolean; actorId: string | null }>>
) => ({
  list: jest.fn((userId: string) => {
    const ring = data[userId];
    if (!ring) return Promise.reject(new Error('missing ring'));
    return Promise.resolve(ring);
  }),
});

describe('ListAllAdminLoginsHandler', () => {
  it('зливає кільця всіх адмінів, сортує новіші-першими', async () => {
    const audit = makeAudit({
      [ADMIN_1]: [
        { ts: new Date('2026-09-29T10:00:00Z'), username: 'owner', ok: true, actorId: null },
      ],
      [ADMIN_2]: [
        { ts: new Date('2026-09-29T12:00:00Z'), username: 'support', ok: false, actorId: null },
      ],
    });
    const handler = new ListAllAdminLoginsHandler({ listAdmins: async () => adminIds }, audit);
    const { entries } = await handler.handle({});
    expect(entries.map((e) => e.username)).toEqual(['support', 'owner']);
    expect(entries.map((e) => e.userId)).toEqual([ADMIN_2, ADMIN_1]);
    expect(audit.list).toHaveBeenCalledTimes(2);
  });

  it('зріз limit після злиття (не per-admin)', async () => {
    const audit = makeAudit({
      [ADMIN_1]: [
        { ts: new Date('2026-09-29T09:00:00Z'), username: 'a', ok: true, actorId: null },
        { ts: new Date('2026-09-29T08:00:00Z'), username: 'b', ok: true, actorId: null },
      ],
      [ADMIN_2]: [{ ts: new Date('2026-09-29T11:00:00Z'), username: 'c', ok: true, actorId: null }],
    });
    const handler = new ListAllAdminLoginsHandler({ listAdmins: async () => adminIds }, audit);
    const { entries } = await handler.handle({ limit: 2 });
    expect(entries.map((e) => e.username)).toEqual(['c', 'a']); // 11:00, 09:00
  });

  it('userId — фільтр: лише кільце цього адміна', async () => {
    const audit = makeAudit({
      [ADMIN_2]: [
        { ts: new Date('2026-09-29T12:00:00Z'), username: 'support', ok: false, actorId: null },
      ],
    });
    const handler = new ListAllAdminLoginsHandler({ listAdmins: async () => adminIds }, audit);
    const { entries } = await handler.handle({ userId: ADMIN_2 });
    expect(entries).toHaveLength(1);
    expect(audit.list).toHaveBeenCalledTimes(1);
    expect(audit.list).toHaveBeenCalledWith(ADMIN_2, 50);
  });

  it('м’яка відмова: адмін без кільця (reject) не ламає подання', async () => {
    const audit = makeAudit({
      [ADMIN_1]: [
        { ts: new Date('2026-09-29T10:00:00Z'), username: 'owner', ok: true, actorId: null },
      ],
      // ADMIN_2 — reject (немає ключа AppSetting)
    });
    const handler = new ListAllAdminLoginsHandler({ listAdmins: async () => adminIds }, audit);
    const { entries } = await handler.handle({});
    expect(entries.map((e) => e.username)).toEqual(['owner']);
  });

  it('limit нормалізується: дефолт 50, max 200, min 1', async () => {
    const audit = makeAudit({});
    const handler = new ListAllAdminLoginsHandler({ listAdmins: async () => adminIds }, audit);
    await handler.handle({});
    expect(audit.list).toHaveBeenLastCalledWith(ADMIN_2, 50);
    await handler.handle({ limit: 9999 });
    expect(audit.list).toHaveBeenLastCalledWith(ADMIN_2, 200);
    await handler.handle({ limit: 0 });
    expect(audit.list).toHaveBeenLastCalledWith(ADMIN_2, 1);
  });
});
