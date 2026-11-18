import { uuidv7 } from '@fade/domain-shared';
import { PrismaService } from './shared/prisma/prisma.service';
import { DEFAULT_ADMIN_ROLES } from './identity/domain/admin-role';
import { createLogger } from './shared/seed/seed-logger';

/**
 * Seed the initial admin roles (T-2400a, ADR 0027). Idempotent: upsert by the
 * unique `key`, so re-running updates name/permissions/priority in place.
 *
 * Exposes `seedAdminRoles` for programmatic use (tests) and runs automatically
 * when executed as a script.
 */
export async function seedAdminRoles(prisma: PrismaService): Promise<string> {
  for (const role of DEFAULT_ADMIN_ROLES) {
    await prisma.adminRole.upsert({
      where: { key: role.key },
      update: {
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        priority: role.priority,
      },
      create: {
        id: uuidv7(),
        key: role.key,
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        priority: role.priority,
      },
    });
  }
  return `Seeded ${DEFAULT_ADMIN_ROLES.length} admin roles`;
}

// If run directly, execute the seed and exit.
if (require.main === module) {
  const logger = createLogger('seed-admin-roles');
  (async () => {
    const prisma = new PrismaService();
    await prisma.$connect();
    try {
      const msg = await seedAdminRoles(prisma);
      logger.log(msg);
    } catch (err) {
      logger.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    } finally {
      await prisma.$disconnect();
      await logger.close();
    }
    process.exit(0);
  })();
}
