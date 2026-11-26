// Outbox для подій вебхука: та сама таблиця OutboxMessage, що й у реле
// identity-модуля, але з власним aggregateType — читач outbox-реле (T-042)
// маршрутизує за `type`, тож події не змішуються з сесійними.
import { Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import type { Prisma } from '@prisma/client';
import type { OutboxPublisher } from '../../billing/domain/ports';
import type { DomainEvent } from '../../shared/domain/domain-event';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class PrismaBillingOutboxPublisher implements OutboxPublisher {
  constructor(private readonly prisma: PrismaService) {}

  async append(events: DomainEvent[]): Promise<void> {
    if (events.length === 0) return;
    await this.prisma.outboxMessage.createMany({
      data: events.map((event) => ({
        id: uuidv7(),
        aggregateType: 'billing',
        type: event.type,
        aggregateId: event.aggregateId,
        payload: event.payload as Prisma.InputJsonValue,
      })),
    });
  }
}
