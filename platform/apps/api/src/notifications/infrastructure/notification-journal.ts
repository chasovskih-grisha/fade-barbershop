// Журнал сповіщень на Prisma (T-4608): вже-обробленість за унікальним eventId
// (патерн T-042c) + запис 'sent'/'skipped' ПІСЛЯ ефекту. 'failed' сюди не
// потрапляє: падіння send у use case лишає подію pending для повтору.

import { Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { NotificationRecordInput } from '../application/send-booking-confirmation';

@Injectable()
export class PrismaNotificationJournal {
  constructor(private readonly prisma: PrismaService) {}

  async alreadyHandled(eventId: string): Promise<boolean> {
    const row = await this.prisma.notificationRecord.findUnique({
      where: { eventId },
      select: { id: true },
    });
    return row !== null;
  }

  async markSent(record: NotificationRecordInput): Promise<void> {
    await this.prisma.notificationRecord.create({
      data: {
        id: uuidv7(),
        eventId: record.eventId,
        type: record.type,
        // Канал доставки (email/sms/both/none) — налагодження в адмінці.
        channel: record.channel,
        recipient: record.recipient,
        subject: record.subject,
        status: record.recipient ? 'sent' : 'skipped',
        detail: record.detail ?? null,
      },
    });
  }
}
