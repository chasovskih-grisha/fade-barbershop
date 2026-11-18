import { PrismaService } from './shared/prisma/prisma.service';
import { seedAdminRoles } from './seed-admin-roles';
import { DEFAULT_ADMIN_ROLES } from './identity/domain/admin-role';

type FakeAdminRoleRepo = { upsert: jest.Mock };

const makePrisma = (): FakeAdminRoleRepo => ({ upsert: jest.fn() });

describe('seedAdminRoles', () => {
  it('upserts every default role by its unique key', async () => {
    const prisma = makePrisma();
    const msg = await seedAdminRoles({ adminRole: prisma } as unknown as PrismaService);

    expect(prisma.upsert).toHaveBeenCalledTimes(DEFAULT_ADMIN_ROLES.length);
    expect(msg).toContain(String(DEFAULT_ADMIN_ROLES.length));
    for (const role of DEFAULT_ADMIN_ROLES) {
      expect(prisma.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { key: role.key },
          update: expect.objectContaining({ name: role.name, priority: role.priority }),
          create: expect.objectContaining({ key: role.key, permissions: role.permissions }),
        })
      );
    }
  });

  it('is idempotent — re-running performs upserts, never blind creates', async () => {
    const prisma = makePrisma();
    await seedAdminRoles({ adminRole: prisma } as unknown as PrismaService);
    await seedAdminRoles({ adminRole: prisma } as unknown as PrismaService);
    expect(prisma.upsert).toHaveBeenCalledTimes(DEFAULT_ADMIN_ROLES.length * 2);
  });
});
