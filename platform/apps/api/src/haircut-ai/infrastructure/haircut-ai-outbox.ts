// Outbox-реле контексту haircut-ai: події пишуться в ту саму транзакцію, що й
// агрегати (PrismaUnitOfWork). Відмінність від identity-реле — aggregateType
// 'haircut-ai', щоб релей міг фільтрувати за контекстом.

import { Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import type { Prisma } from '@prisma/client';
import type { Outbox } from '../domain/ports';
import { currentDb } from '../../shared/prisma/prisma-context';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class PrismaHaircutAiOutbox implements Outbox {
  constructor(private readonly prisma: PrismaService) {}

  async append(
    events: readonly { type: string; aggregateId: string; payload: unknown }[]
  ): Promise<void> {
    if (events.length === 0) return;
    const db = currentDb() ?? (this.prisma as Prisma.TransactionClient);
    await db.outboxMessage.createMany({
      data: events.map((event) => ({
        id: uuidv7(),
        aggregateType: 'haircut-ai',
        type: event.type,
        aggregateId: event.aggregateId,
        payload: event.payload as Prisma.InputJsonValue,
      })),
    });
  }
}
