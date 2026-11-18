// Prisma-адаптер репозиторію Session. Транзакції через PrismaUnitOfWork
// використовують активний tx-клієнт (currentDb), інакше — базовий.
// T-014: refresh-токени mobile — findByRefreshHash і CAS-ротація (updateMany
// з where по поточному refresh-хешу: гонка двох refresh — виграє один).

import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { Session } from '../domain/session';
import type { SessionRepository } from '../domain/ports';
import { currentDb } from '../../shared/prisma/prisma-context';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { reconstituteSession } from './prisma-session.mapper';

@Injectable()
export class PrismaSessionRepository implements SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  private db(): Prisma.TransactionClient {
    return currentDb() ?? (this.prisma as Prisma.TransactionClient);
  }

  async save(session: Session): Promise<void> {
    const fields = {
      userId: session.userId,
      channel: session.channel,
      tokenHash: session.tokenHash,
      refreshTokenHash: session.refreshTokenHash,
      previousRefreshHash: session.previousRefreshHash,
      accessExpiresAt: session.accessExpiresAt,
      refreshExpiresAt: session.refreshExpiresAt,
      revokedAt: session.revokedAt,
    };
    await this.db().session.upsert({
      where: { id: session.id },
      // create включає id; update — лише поля стану (id не міняється).
      create: { id: session.id, ...fields },
      update: fields,
    });
  }

  async findByTokenHash(tokenHash: string): Promise<Session | null> {
    const row = await this.db().session.findUnique({ where: { tokenHash } });
    return row ? reconstituteSession(row) : null;
  }

  async findByRefreshHash(refreshHash: string): Promise<Session | null> {
    const row = await this.db().session.findUnique({ where: { refreshTokenHash: refreshHash } });
    return row ? reconstituteSession(row) : null;
  }

  /** T-4422: активні сесії користувача — список пристроїв, «вийти скрізь». */
  async findActiveByUser(userId: string): Promise<Session[]> {
    const rows = await this.db().session.findMany({ where: { userId, revokedAt: null } });
    return rows.map(reconstituteSession);
  }

  /** T-014: reuse-детект — one-step історія ротації в колонці previousRefreshHash. */
  async findByPreviousRefreshHash(previousHash: string): Promise<Session | null> {
    const row = await this.db().session.findFirst({ where: { previousRefreshHash: previousHash } });
    return row ? reconstituteSession(row) : null;
  }

  /** T-014: CAS-ротація — оновлення лише якщо поточний refresh-хеш у БД
   * дорівнює очікуваному. Повертає кількість оновлених рядків (0/1). */
  async rotateTokens(input: {
    sessionId: string;
    expectedRefreshHash: string;
    accessHash: string;
    refreshTokenHash: string;
    accessExpiresAt: Date;
    refreshExpiresAt: Date;
  }): Promise<number> {
    const result = await this.db().session.updateMany({
      where: { id: input.sessionId, refreshTokenHash: input.expectedRefreshHash, revokedAt: null },
      data: {
        tokenHash: input.accessHash,
        // one-step історія: поточний стає previous (reuse-детект).
        previousRefreshHash: input.expectedRefreshHash,
        refreshTokenHash: input.refreshTokenHash,
        accessExpiresAt: input.accessExpiresAt,
        refreshExpiresAt: input.refreshExpiresAt,
      },
    });
    return result.count;
  }

  /** T-4411: інвалідація всіх активних сесій (пароль/блокування) — лише revokedAt. */
  async revokeAllForUser(userId: string, now: Date): Promise<number> {
    const result = await this.db().session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: now },
    });
    return result.count;
  }
}
