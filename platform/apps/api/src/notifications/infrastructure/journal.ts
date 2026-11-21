// Журнал доставлених сповіщень: анти-спам і аудит каналу.
// Запис лягає в outbox як уже опубліковане повідомлення типу
// `notification.sent` — окремої таблиці журналу не заводимо.
import { Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import { PrismaService } from '../../shared/prisma/prisma.service';

export interface NotificationJournalEntry {
  eventId: string;
  type: string;
  channel: string;
  recipient: string;
  subject: string;
}

export interface NotificationJournal {
  markSent(entry: NotificationJournalEntry): Promise<void>;
}

@Injectable()
export class PrismaJournal implements NotificationJournal {
  constructor(private readonly prisma: PrismaService) {}

  async markSent(entry: NotificationJournalEntry): Promise<void> {
    await this.prisma.outboxMessage.create({
      data: {
        id: uuidv7(),
        aggregateType: 'notification',
        aggregateId: entry.eventId,
        type: 'notification.sent',
        payload: {
          eventType: entry.type,
          channel: entry.channel,
          recipient: entry.recipient,
          subject: entry.subject,
        },
        status: 'published',
        publishedAt: new Date(),
      },
    });
  }
}
