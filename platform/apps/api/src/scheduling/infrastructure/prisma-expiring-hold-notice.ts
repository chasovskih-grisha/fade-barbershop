// T-4619: durable право на нагадування про дедлайн депозиту.
//
// Ознака «вже нагадали» — сама подія в outbox із тим самим aggregateId. Тому
// рестарт, друга інстанція процесу чи повторний тік не дублюють повідомлення,
// і для цього не потрібна нова колонка: outbox і так є журналом фактів.
import { Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type {
  ExpiringHoldNotice,
  ExpiringHoldNoticePort,
} from '../application/nudge-expiring-holds';

const NOTICE_TYPE = 'deposit_hold.expiring';

@Injectable()
export class PrismaExpiringHoldNotice implements ExpiringHoldNoticePort {
  constructor(private readonly prisma: PrismaService) {}

  async claim(notice: ExpiringHoldNotice): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.outboxMessage.findFirst({
        where: { type: NOTICE_TYPE, aggregateId: notice.appointmentId },
        select: { id: true },
      });
      if (existing) return false;

      await tx.outboxMessage.create({
        data: {
          id: uuidv7(),
          aggregateType: 'appointment',
          aggregateId: notice.appointmentId,
          type: NOTICE_TYPE,
          payload: {
            appointmentId: notice.appointmentId,
            barberId: notice.barberId,
            locationId: notice.locationId,
            depositAmount: notice.depositAmount,
            expiresAt: notice.expiresAt.toISOString(),
            occurredAt: notice.at.toISOString(),
          },
        },
      });
      return true;
    });
  }
}
