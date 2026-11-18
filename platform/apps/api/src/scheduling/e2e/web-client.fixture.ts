import { testPhone } from '@fade/test-utils';
import { uuidv7 } from '@fade/domain-shared';
import { hashToken } from '../../identity/domain/otp-code';
import type { PrismaService } from '../../shared/prisma/prisma.service';

/**
 * Клієнтська сесія для e2e. `token` має бути унікальним на прогін:
 * Session.tokenHash — @unique, тому фіксований токен робить паралельні сюїти
 * залежними від порядку (P2002 на другому insert, а guard встигає підставити
 * сесію іншого користувача → 401). Див. callers із `uuidv7()` у токені.
 */
export async function seedWebClient(
  prisma: PrismaService,
  userId: string,
  token: string
): Promise<void> {
  await prisma.user.create({
    data: { id: userId, phone: testPhone(), role: 'client', name: 'Клієнт' },
  });
  await prisma.session.create({
    data: { id: uuidv7(), userId, channel: 'web', tokenHash: hashToken(token) },
  });
}

export async function dropWebClient(prisma: PrismaService, userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
}
