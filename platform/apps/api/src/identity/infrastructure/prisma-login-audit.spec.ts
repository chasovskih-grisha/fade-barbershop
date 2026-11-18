// Інтеграційний спек PrismaLoginAudit (T-4411): запис аудиту має переживати
// відкат транзакції use case (пастка описана у fakes).

import { PrismaLoginAudit } from './prisma-login-audit';
import { PrismaUnitOfWork } from '../../shared/prisma/prisma-context';
import { makePrisma } from './prisma-login-audit.fakes';
import type { LoginAttempt } from '../domain/ports';
import { uuidv7 } from '@fade/domain-shared';

const USER_1 = uuidv7();
const USER_2 = uuidv7();

/** Фейк-Prisma + адаптер, готовий до тесту. */
function makeAudit() {
  const { prisma } = makePrisma();
  return { prisma, audit: new PrismaLoginAudit(prisma) };
}

function attempt(partial: Partial<LoginAttempt> = {}): LoginAttempt {
  return {
    ts: new Date('2026-09-28T10:00:00.000Z'),
    username: 'owner',
    ok: true,
    actorId: USER_1,
    ...partial,
  };
}

describe('PrismaLoginAudit', () => {
  it('запис всередині відкоченої транзакції переживає відкат (невдалі входи не зникають)', async () => {
    const { prisma, audit } = makeAudit();
    const uow = new PrismaUnitOfWork(prisma);

    await expect(
      uow.run(async () => {
        await audit.record(USER_1, attempt({ ok: false, actorId: null }));
        throw new Error('boom: бізнес-помилка use case');
      })
    ).rejects.toThrow('boom');

    const entries = await audit.list(USER_1, 20);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ username: 'owner', ok: false });
  });

  it('успішний вхід читається новішими першими (reverse)', async () => {
    const { audit } = makeAudit();

    await audit.record(USER_1, attempt({ ts: new Date('2026-09-28T09:00:00.000Z') }));
    await audit.record(USER_1, attempt({ ts: new Date('2026-09-28T10:00:00.000Z'), ok: false }));

    const entries = await audit.list(USER_1, 20);
    expect(entries.map((e) => e.ts.toISOString())).toEqual([
      '2026-09-28T10:00:00.000Z',
      '2026-09-28T09:00:00.000Z',
    ]);
    expect(entries[0]?.ok).toBe(false);
  });

  it('кільце ≤50: старі записи витісняються, limit > 50 не дає більше за 50', async () => {
    const { audit } = makeAudit();

    for (let i = 0; i < 55; i++) {
      await audit.record(USER_1, attempt({ ts: new Date(Date.UTC(2026, 8, 28, 8, i)) }));
    }

    const all = await audit.list(USER_1, 999);
    expect(all).toHaveLength(50);
    expect(all[0]?.ts.toISOString()).toBe('2026-09-28T08:54:00.000Z'); // новіший перший
    expect(all[49]?.ts.toISOString()).toBe('2026-09-28T08:05:00.000Z'); // 5 найстаріших витіснено
  });

  it('різні userId мають незалежні журнали', async () => {
    const { audit } = makeAudit();

    await audit.record(USER_1, attempt());
    await audit.record(USER_2, attempt({ username: 'second', ok: false }));

    expect(await audit.list(USER_1, 20)).toHaveLength(1);
    const u2 = await audit.list(USER_2, 20);
    expect(u2).toHaveLength(1);
    expect(u2[0]?.username).toBe('second');
    expect(u2[0]?.ok).toBe(false);
  });
});
