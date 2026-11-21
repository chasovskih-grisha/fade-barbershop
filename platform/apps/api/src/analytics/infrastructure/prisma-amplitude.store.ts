// Prisma-черга Amplitude (T-4587): доменні події з OutboxMessage переносяться
// ідемпотентно (sourceEventId унікальний), батчі позначаються sent, збої
// отримують backoff або dead_letter.
import { Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { AmplitudeStore, StoredAmplitudeEvent } from '../application/amplitude.ports';
import {
  FORWARDED_EVENT_TYPES,
  toAmplitudeEvent,
  type AmplitudeEvent,
} from '../domain/amplitude-events';

@Injectable()
export class PrismaAmplitudeStore implements AmplitudeStore {
  constructor(private readonly prisma: PrismaService) {}

  async enqueueRecent(since: Date, limit: number): Promise<number> {
    const messages = await this.prisma.outboxMessage.findMany({
      where: { createdAt: { gte: since }, type: { in: [...FORWARDED_EVENT_TYPES] } },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
    let enqueued = 0;
    for (const message of messages) {
      const event = toAmplitudeEvent({
        id: message.id,
        type: message.type,
        aggregateId: message.aggregateId,
        payload: (message.payload ?? {}) as Record<string, unknown>,
        occurredAt: message.createdAt,
      });
      if (!event) continue;
      const created = await this.prisma.amplitudeOutbox.createMany({
        data: [
          {
            id: uuidv7(),
            sourceEventId: message.id,
            eventName: event.event_type,
            insertId: event.insert_id,
            payload: JSON.parse(JSON.stringify(event)) as object,
          },
        ],
        skipDuplicates: true,
      });
      enqueued += created.count;
    }
    return enqueued;
  }

  async pending(now: Date, limit: number): Promise<StoredAmplitudeEvent[]> {
    const rows = await this.prisma.amplitudeOutbox.findMany({
      where: { status: 'pending', nextAttemptAt: { lte: now } },
      orderBy: { nextAttemptAt: 'asc' },
      take: limit,
    });
    return rows.map((row) => ({
      id: row.id,
      event: row.payload as unknown as AmplitudeEvent,
      attempts: row.attempts,
    }));
  }

  async markSent(ids: readonly string[], now: Date): Promise<void> {
    if (ids.length === 0) return;
    await this.prisma.amplitudeOutbox.updateMany({
      where: { id: { in: [...ids] } },
      data: { status: 'sent', sentAt: now, lastError: null },
    });
  }

  async markFailed(id: string, nextAttemptAt: Date | null, error: string): Promise<void> {
    await this.prisma.amplitudeOutbox.update({
      where: { id },
      data: {
        status: nextAttemptAt ? 'pending' : 'dead_letter',
        attempts: { increment: 1 },
        lastError: error,
        ...(nextAttemptAt ? { nextAttemptAt } : {}),
      },
    });
  }
}
