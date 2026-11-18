import { uuidv7 } from '@fade/domain-shared';
import { PrismaService } from './shared/prisma/prisma.service';
import { PhoneNumber } from './identity/domain/phone-number';
import { PASSWORD_MIN_LENGTH, hashPassword } from './identity/domain/password';
import { createLogger } from './shared/seed/seed-logger';

/**
 * Seed founder admin user with username + password (T-013).
 *
 * Exposes `seedAdmin` for programmatic use (tests) and runs automatically when
 * executed as a script.
 *
 * Credentials come from env (dev defaults for local only):
 *   FADE_ADMIN_PHONE (E.164), FADE_ADMIN_USERNAME, FADE_ADMIN_PASSWORD
 */
export async function seedAdmin(prisma: PrismaService): Promise<string> {
  const adminPhone = process.env.FADE_ADMIN_PHONE ?? '+380000000001';
  const username = process.env.FADE_ADMIN_USERNAME ?? 'owner';
  const password = process.env.FADE_ADMIN_PASSWORD ?? 'FadeOwner2026';

  let phoneNumber: PhoneNumber;
  try {
    phoneNumber = PhoneNumber.of(adminPhone);
  } catch {
    throw new Error('FADE_ADMIN_PHONE must be a valid E.164 number');
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    throw new Error(`FADE_ADMIN_PASSWORD must be at least ${PASSWORD_MIN_LENGTH} chars`);
  }

  const passwordHash = hashPassword(password);
  const existing = await prisma.user.findUnique({ where: { phone: phoneNumber.value } });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: 'admin', name: username, username, passwordHash },
    });
    return `Admin user updated with phone ${phoneNumber.value}`;
  }

  await prisma.user.create({
    data: {
      id: uuidv7(),
      phone: phoneNumber.value,
      role: 'admin',
      name: username,
      username,
      passwordHash,
    },
  });

  return `Founder admin created with phone ${phoneNumber.value}`;
}

// If run directly, execute the seed and exit.
if (require.main === module) {
  const logger = createLogger('seed-admin');
  (async () => {
    const prisma = new PrismaService();
    await prisma.$connect();
    try {
      const msg = await seedAdmin(prisma);
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
