// Outbox-реле на Prisma: події пишуться в ту саму транзакцію що й агрегати
// (unit of work). Читає тільки outbox-реле повідомлювача (T-042) — типу `type` вистачає.

import { Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import type { Prisma } from '@prisma/client';
import type { Outbox } from './domain/ports';
import { currentDb } from '../shared/prisma/prisma-context';
import { PrismaService } from '../shared/prisma/prisma.service';

@Injectable()
export class PrismaOutboxPublisher implements Outbox {
  constructor(private readonly prisma: PrismaService) {}

  private db(): Prisma.TransactionClient {
    return currentDb() ?? (this.prisma as unknown as Prisma.TransactionClient);
  }

  async append(
    events: readonly { type: string; aggregateId: string; payload: unknown }[]
  ): Promise<void> {
    if (events.length === 0) return;
    await this.db().outboxMessage.createMany({
      data: events.map((event) => ({
        id: uuidv7(),
        aggregateType: 'crm',
        type: event.type,
        aggregateId: event.aggregateId,
        payload: event.payload as Prisma.InputJsonValue,
      })),
    });
  }
}
