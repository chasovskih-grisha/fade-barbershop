import { PrismaService } from './shared/prisma/prisma.service';
import { DEFAULT_CUSTOMERS, resolveSeedCustomers, seedCustomers } from './seed-customers';
import { SEED_ENV_KEYS, makeSeedPrisma } from './seed-customers.fakes';

afterEach(() => {
  for (const key of SEED_ENV_KEYS) delete process.env[key];
});

describe('seedCustomers CRM and env', () => {
  it('CRM-профіль: створює ClientProfile (id=userId) для кожного клієнта', async () => {
    const prisma = makeSeedPrisma();
    const summary = await seedCustomers({
      user: prisma.user,
      clientProfile: prisma.clientProfile,
    } as unknown as PrismaService);

    // спершу шукає за userId, потім за phone — обидва промахи → create
    expect(prisma.clientProfile.findUnique).toHaveBeenCalledWith({ where: { userId: 'u1' } });
    expect(prisma.clientProfile.findUnique).toHaveBeenCalledWith({
      where: { phone: '+380501112233' },
    });
    expect(summary.profilesCreated).toBe(DEFAULT_CUSTOMERS.length);
    expect(summary.profilesUpdated).toBe(0);
    expect(prisma.clientProfile.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: 'u1',
        userId: 'u1',
        name: 'Олена Клієнт',
        phone: '+380501112233',
      }),
    });
  });

  it('CRM-профіль: наявний профіль оновлює контактні поля і НЕ чіпає лояльність/VIP', async () => {
    const prisma = makeSeedPrisma();
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    // профіль знайдено за phone-резервом (створений адмінкою до сід-користувача)
    prisma.clientProfile.findUnique.mockImplementation(({ where }) =>
      Promise.resolve(
        'phone' in where ? { id: 'p1', vipDiscountPercent: 10, loyaltyVisitsCount: 7 } : null
      )
    );
    const summary = await seedCustomers({
      user: prisma.user,
      clientProfile: prisma.clientProfile,
    } as unknown as PrismaService);

    expect(summary.profilesCreated).toBe(0);
    expect(summary.profilesUpdated).toBe(DEFAULT_CUSTOMERS.length);
    // лише name/phone — лояльність лишається домену CRM (T-012: сід минає агрегати)
    expect(prisma.clientProfile.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { name: expect.any(String), phone: expect.any(String) },
    });
  });

  it('env FADE_SEED_CUSTOMERS_PHONE перевизначає ростер (CI/стейдж)', async () => {
    process.env.FADE_SEED_CUSTOMERS_PHONE = '0509998877';
    process.env.FADE_SEED_CUSTOMERS_NAME = 'Зовнішній Клієнт';
    const prisma = makeSeedPrisma();
    const summary = await seedCustomers({
      user: prisma.user,
      clientProfile: prisma.clientProfile,
    } as unknown as PrismaService);

    expect(resolveSeedCustomers()).toEqual([{ phone: '0509998877', name: 'Зовнішній Клієнт' }]);
    expect(summary.phones).toEqual(['+380509998877']);
    expect(prisma.user.create).toHaveBeenCalledTimes(1);
    expect(summary.profilesCreated).toBe(1);
  });
});
