// Prisma-адаптер репозиторію PushToken (T-070/T-4422). Токен — унікальний
// ключ апарата, тому save це upsert за token (id рядка не міняється при
// переприв'язці на нову сесію). Транзакції — через currentDb (патерн
// PrismaSessionRepository).

import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PushToken, type PushPlatform } from '../domain/push-token';
import type { PushTokenRepository } from '../domain/ports';
import { currentDb } from '../../shared/prisma/prisma-context';
import { PrismaService } from '../../shared/prisma/prisma.service';

type PushTokenRow = {
  id: string;
  userId: string;
  sessionId: string;
  token: string;
  platform: string;
  createdAt: Date;
  lastSeenAt: Date;
  revokedAt: Date | null;
};

function reconstitute(row: PushTokenRow): PushToken {
  return PushToken.fromData({
    id: row.id,
    userId: row.userId,
    sessionId: row.sessionId,
    token: row.token,
    platform: row.platform as PushPlatform,
    createdAt: row.createdAt,
    lastSeenAt: row.lastSeenAt,
    revokedAt: row.revokedAt,
  });
}

@Injectable()
export class PrismaPushTokenRepository implements PushTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  private db(): Prisma.TransactionClient {
    return currentDb() ?? (this.prisma as Prisma.TransactionClient);
  }

  async findByToken(token: string): Promise<PushToken | null> {
    const row = await this.db().pushToken.findUnique({ where: { token } });
    return row ? reconstitute(row) : null;
  }

  async save(pushToken: PushToken): Promise<void> {
    const fields = {
      userId: pushToken.userId,
      sessionId: pushToken.sessionId,
      platform: pushToken.platform,
      lastSeenAt: pushToken.lastSeenAt,
      revokedAt: pushToken.revokedAt,
    };
    await this.db().pushToken.upsert({
      where: { token: pushToken.token },
      create: {
        id: pushToken.id,
        token: pushToken.token,
        createdAt: pushToken.createdAt,
        ...fields,
      },
      update: fields,
    });
  }

  /** Лише «свій» токен: чужий рядок не чіпаємо навіть при збігу токена. */
  async revokeByToken(token: string, userId: string, at: Date): Promise<boolean> {
    const result = await this.db().pushToken.updateMany({
      where: { token, userId, revokedAt: null },
      data: { revokedAt: at },
    });
    return result.count > 0;
  }
}
