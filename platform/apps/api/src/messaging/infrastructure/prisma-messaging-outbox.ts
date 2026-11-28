// Outbox чату (T-081): подія пише в ту саму транзакцію, що й повідомлення, а
// релей notifications доставляє push. Тут лише append — читає релей.
import { Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import type { Prisma } from '@prisma/client';
import { currentDb } from '../../shared/prisma/prisma-context';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { MessagingOutbox } from '../domain/ports';

@Injectable()
export class PrismaMessagingOutbox implements MessagingOutbox {
  constructor(private readonly prisma: PrismaService) {}

  private db(): Prisma.TransactionClient {
    return currentDb() ?? (this.prisma as Prisma.TransactionClient);
  }

  async append(
    events: readonly { type: string; aggregateId: string; payload: Record<string, unknown> }[]
  ): Promise<void> {
    if (events.length === 0) return;
    await this.db().outboxMessage.createMany({
      data: events.map((event) => ({
        id: uuidv7(),
        aggregateType: 'conversation',
        type: event.type,
        aggregateId: event.aggregateId,
        payload: event.payload as Prisma.InputJsonValue,
      })),
    });
  }
}
