// Prisma-адаптер утримання (T-4490): видаляє прострочені журнали й сесії,
// перевіряє залишок і пише аудит у RetentionPurge (переживає рестарт).
import { Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import { PrismaService } from '../prisma/prisma.service';
import type { RetentionAuditEntry, RetentionDataset } from './retention-policy';
import type { RetentionStore } from './retention.ports';

@Injectable()
export class PrismaRetentionStore implements RetentionStore {
  constructor(private readonly prisma: PrismaService) {}

  async purge(dataset: RetentionDataset, cutoff: Date): Promise<number> {
    switch (dataset) {
      case 'otp_challenges': {
        const result = await this.prisma.otpChallenge.deleteMany({
          where: { OR: [{ usedAt: { lte: cutoff } }, { expiresAt: { lt: cutoff } }] },
        });
        return result.count;
      }
      case 'sessions': {
        const result = await this.prisma.session.deleteMany({
          where: {
            OR: [
              { revokedAt: { lte: cutoff } },
              { refreshExpiresAt: { lt: cutoff } },
              { accessExpiresAt: { lt: cutoff }, refreshExpiresAt: null },
            ],
          },
        });
        return result.count;
      }
      case 'notification_records': {
        const result = await this.prisma.notificationRecord.deleteMany({
          where: { sentAt: { lt: cutoff } },
        });
        return result.count;
      }
    }
  }

  async remainingExpired(dataset: RetentionDataset, cutoff: Date): Promise<number> {
    switch (dataset) {
      case 'otp_challenges':
        return this.prisma.otpChallenge.count({
          where: { OR: [{ usedAt: { lte: cutoff } }, { expiresAt: { lt: cutoff } }] },
        });
      case 'sessions':
        return this.prisma.session.count({
          where: {
            OR: [
              { revokedAt: { lte: cutoff } },
              { refreshExpiresAt: { lt: cutoff } },
              { accessExpiresAt: { lt: cutoff }, refreshExpiresAt: null },
            ],
          },
        });
      case 'notification_records':
        return this.prisma.notificationRecord.count({ where: { sentAt: { lt: cutoff } } });
    }
  }

  async recordAudit(entry: RetentionAuditEntry, at: Date): Promise<void> {
    await this.prisma.retentionPurge.create({
      data: {
        id: uuidv7(),
        dataset: entry.dataset,
        cutoff: new Date(entry.cutoff),
        purged: entry.purged,
        remainingExpired: entry.remainingExpired,
        held: entry.held,
        ranAt: at,
      },
    });
  }
}
