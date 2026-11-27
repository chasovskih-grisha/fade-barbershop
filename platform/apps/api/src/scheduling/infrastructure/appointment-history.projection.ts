// Проекція AppointmentHistory (T-4534): обробляє події outbox для
// агрографіку та створює записи в таблиці AppointmentHistory.

import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { currentDb } from '../../shared/prisma/prisma-context';
import { PrismaAppointmentHistoryRepository } from './prisma-appointment-history.repository';

@Injectable()
export class AppointmentHistoryProjection {
  private readonly logger = new Logger(AppointmentHistoryProjection.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly historyRepository: PrismaAppointmentHistoryRepository
  ) {}

  async processOutboxEvents(): Promise<void> {
    const db = this.db();

    // Отримуємо події outbox для appointment, що змінили статус
    const allEvents = await db.outboxMessage.findMany({
      where: {
        aggregateType: 'appointment',
        type: {
          in: [
            'scheduling.appointment.booked',
            'scheduling.appointment.confirmed',
            'scheduling.appointment.started',
            'scheduling.appointment.completed',
            'scheduling.appointment.cancelled',
            'scheduling.appointment.no_showed',
          ],
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (allEvents.length === 0) return;

    // Обробляємо кожну подію окремо
    for (const event of allEvents) {
      const payload = event.payload as Record<string, unknown> | null;
      const appointmentId = event.aggregateId;

      if (!appointmentId) {
        this.logger.warn(`Outbox event without aggregateId: ${event.id}`);
        continue;
      }

      // Обрахункція мапування типу події до статусу
      const statusMap: Record<string, string> = {
        'scheduling.appointment.booked': 'booked',
        'scheduling.appointment.confirmed': 'confirmed',
        'scheduling.appointment.started': 'in_progress',
        'scheduling.appointment.completed': 'completed',
        'scheduling.appointment.cancelled': 'cancelled',
        'scheduling.appointment.no_showed': 'no_show',
      };

      const toStatus = statusMap[event.type];
      if (!toStatus) {
        this.logger.log(`Unknown status type: ${event.type}`);
        continue;
      }

      // Витягуємо опційні поля з payload
      const actorId = payload?.['actorId'] as string | null;
      const actorRole = payload?.['actorRole'] as string | null;
      const reason = payload?.['reason'] as string | null;

      // Отримуємо поточну остання запис історії
      const existingLast = await this.historyRepository.findLastByAppointmentId(appointmentId);
      const fromStatus = existingLast?.toStatus ?? null;

      // Створюємо новий Eint історії - використовує createdAt як occurredAt
      await this.historyRepository.create(appointmentId, fromStatus, toStatus, actorId, actorRole, reason, event.createdAt, event.id);

      this.logger.log(
        `Created appointment history entry: ${appointmentId} ${event.type} -> ${toStatus}`
      );
    }
  }

  private db(): Prisma.TransactionClient {
    return currentDb() ?? (this.prisma as Prisma.TransactionClient);
  }
}