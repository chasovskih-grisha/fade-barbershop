// Prisma-адаптер ReminderSchedule: відкладена подія нагадування живе в
// OutboxMessage (availableAt), тож переживає рестарт процесу — на відміну від
// таймера в пам'яті. Скасування (перенесення візиту) позначає рядок
// status='cancelled' + publishedAt, щоб релей більше не бачив його.

import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { uuidv7 } from '@fade/domain-shared';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  REMINDER_DUE_EVENT_TYPE,
  type ReminderDuePayload,
  type ReminderSchedule,
} from '../application/appointment-reminder-ports';

@Injectable()
export class PrismaReminderSchedule implements ReminderSchedule {
  constructor(private readonly prisma: PrismaService) {}

  async schedule(input: {
    appointmentId: string;
    fireAt: Date;
    payload: ReminderDuePayload;
  }): Promise<void> {
    await this.prisma.outboxMessage.create({
      data: {
        id: uuidv7(),
        aggregateType: 'appointment',
        aggregateId: input.appointmentId,
        type: REMINDER_DUE_EVENT_TYPE,
        // Payload — плоский JSON без вкладених об'єктів (контракт домену).
        payload: input.payload as unknown as Prisma.InputJsonValue,
        availableAt: input.fireAt,
      },
    });
  }

  /** Закриває нагадування, які ще не спрацювали: перенесення змінило час. */
  async cancelPending(appointmentId: string): Promise<number> {
    const result = await this.prisma.outboxMessage.updateMany({
      where: {
        aggregateType: 'appointment',
        aggregateId: appointmentId,
        type: REMINDER_DUE_EVENT_TYPE,
        publishedAt: null,
      },
      data: { status: 'cancelled', publishedAt: new Date() },
    });
    return result.count;
  }
}
