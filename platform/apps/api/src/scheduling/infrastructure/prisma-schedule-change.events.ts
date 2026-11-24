// T-4458: подія згоди клієнта у спільному outbox. Запис іде в поточній
// транзакції; `claimConfirmation` гарантує один запис на eventId.
import { Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import { currentDb } from '../../shared/prisma/prisma-context';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { Prisma } from '@prisma/client';
import type {
  ScheduleChangeConfirmedEvent,
  ScheduleChangeEvents,
} from '../application/schedule-change-approval.service';

@Injectable()
export class PrismaScheduleChangeEvents implements ScheduleChangeEvents {
  constructor(private readonly prisma: PrismaService) {}

  private db(): Prisma.TransactionClient {
    return currentDb() ?? (this.prisma as Prisma.TransactionClient);
  }

  async append(event: ScheduleChangeConfirmedEvent): Promise<void> {
    await this.db().outboxMessage.create({
      data: {
        id: uuidv7(),
        aggregateType: 'appointment',
        aggregateId: event.payload.appointmentId,
        type: event.type,
        payload: event.payload as unknown as Prisma.InputJsonValue,
      },
    });
  }
}
