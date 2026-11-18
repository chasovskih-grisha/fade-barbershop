// PrismaDepositPolicySettings (PAY-ADM-09, T-4444): AppSetting → політика,
// зміна правил → версія N+1 і рядок історії; незмінена політика версію не рухає.
import { PrismaDepositPolicySettings } from './prisma-deposit-policy-settings';
import { DEFAULT_DEPOSIT_POLICY } from '../domain/deposit-terms';
import { DEPOSIT_POLICY_SETTING_KEY } from '../domain/deposit-policy-settings';

function prismaStub(value?: unknown, fail = false) {
  const findUnique = fail
    ? jest.fn().mockRejectedValue(new Error('db down'))
    : jest
        .fn()
        .mockResolvedValue(value === undefined ? null : { key: DEPOSIT_POLICY_SETTING_KEY, value });
  const upsert = jest.fn().mockResolvedValue({});
  const create = jest.fn().mockResolvedValue({});
  const tx = { depositPolicyVersion: { create }, appSetting: { upsert } };
  const transaction = jest.fn(async (work: (client: typeof tx) => Promise<void>) => work(tx));
  return {
    prisma: {
      appSetting: { findUnique, upsert },
      depositPolicyVersion: { create },
      $transaction: transaction,
    } as never,
    findUnique,
    upsert,
    create,
  };
}

describe('PrismaDepositPolicySettings', () => {
  it('без рядка віддає дефолти й версію 1', async () => {
    const { prisma, findUnique } = prismaStub();
    const settings = new PrismaDepositPolicySettings(prisma);

    await expect(settings.getVersioned()).resolves.toEqual({
      ...DEFAULT_DEPOSIT_POLICY,
      version: 1,
    });
    expect(findUnique).toHaveBeenCalledWith({ where: { key: DEPOSIT_POLICY_SETTING_KEY } });
  });

  it('збій БД не ламає запис візиту — дефолти й версія 1', async () => {
    const { prisma } = prismaStub(undefined, true);

    await expect(new PrismaDepositPolicySettings(prisma).get()).resolves.toEqual(
      DEFAULT_DEPOSIT_POLICY
    );
  });

  it('зміна правил пише версію N+1 і рядок історії в транзакції', async () => {
    const { prisma, create, upsert } = prismaStub({ ...DEFAULT_DEPOSIT_POLICY, version: 1 });
    const settings = new PrismaDepositPolicySettings(prisma);

    await expect(
      settings.set({ percent: 50, rounding: 5, cancellationWindowHours: 2 })
    ).resolves.toEqual({
      percent: 50,
      rounding: 5,
      cancellationWindowHours: 2,
      version: 2,
    });
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        version: 2,
        percent: 50,
        rounding: 5,
        cancellationWindowHours: 2,
      }),
    });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { value: { percent: 50, rounding: 5, cancellationWindowHours: 2, version: 2 } },
      })
    );
  });

  it('незмінена політика версію не рухає', async () => {
    const { prisma, create, upsert } = prismaStub({ ...DEFAULT_DEPOSIT_POLICY, version: 2 });

    await new PrismaDepositPolicySettings(prisma).set(DEFAULT_DEPOSIT_POLICY);

    expect(create).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it('історія віддається від новіших версій із підписами', async () => {
    const rows = [
      {
        version: 2,
        percent: 50,
        rounding: 5,
        cancellationWindowHours: 2,
        createdAt: new Date('2026-12-07T10:00:00Z'),
        createdBy: 'admin-1',
      },
    ];
    const findMany = jest.fn().mockResolvedValue(rows);
    const settings = new PrismaDepositPolicySettings({
      depositPolicyVersion: { findMany },
    } as never);

    await expect(settings.history()).resolves.toEqual(rows);
    expect(findMany).toHaveBeenCalledWith({ orderBy: { version: 'desc' }, take: 20 });
  });
});
