import { PrismaService } from './shared/prisma/prisma.service';
import { DEFAULT_CUSTOMERS, seedCustomers } from './seed-customers';
import { SEED_ENV_KEYS, makeSeedPrisma } from './seed-customers.fakes';

afterEach(() => {
  for (const key of SEED_ENV_KEYS) delete process.env[key];
});

describe('seedCustomers', () => {
  it('створює всіх дефолтних клієнтів з нормалізованими E.164-телефонами', async () => {
    const prisma = makeSeedPrisma();
    const summary = await seedCustomers({
      user: prisma.user,
      clientProfile: prisma.clientProfile,
    } as unknown as PrismaService);

    expect(summary.created).toBe(DEFAULT_CUSTOMERS.length);
    expect(summary.updated).toBe(0);
    expect(summary.phones.every((p) => /^\+380\d{9}$/.test(p))).toBe(true);
    expect(prisma.user.create).toHaveBeenCalledTimes(DEFAULT_CUSTOMERS.length);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        phone: '+380501112233',
        role: 'client',
        active: true,
        selfSchedule: false,
      }),
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('ідемпотентний: другий прогін оновлює, а не створює', async () => {
    const prisma = makeSeedPrisma();
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    const summary = await seedCustomers({
      user: prisma.user,
      clientProfile: prisma.clientProfile,
    } as unknown as PrismaService);

    expect(summary).toMatchObject({ created: 0, updated: DEFAULT_CUSTOMERS.length });
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { name: expect.any(String), active: true },
    });
  });

  it('сам валідує номер через домен (не-E.164/10-значний вихід → помилка до БД)', async () => {
    const prisma = makeSeedPrisma();
    await expect(
      seedCustomers(
        { user: prisma.user, clientProfile: prisma.clientProfile } as unknown as PrismaService,
        [{ phone: '12345', name: 'Псевдо' }]
      )
    ).rejects.toThrow('Invalid Ukraine phone number');
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.clientProfile.create).not.toHaveBeenCalled();
  });
});
