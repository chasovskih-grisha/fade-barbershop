// Prisma-адаптер Appointment (T-042a): агрегат живе на рядку Booking —
// колонки appointmentId/status/cancelReason додає міграція. Стан і бронювання —
// одна сутність БД: life-cycle не може розійтися зі слотом. Події агрегату
// дописуються в outbox тією ж транзакцією (unit of work, патерн ADR 0009).
// Мапінг рядка → агрегат — у prisma-appointment.repository.row.ts.

import { Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { currentDb } from '../../shared/prisma/prisma-context';
import { Appointment, type AppointmentStatus } from '../domain/appointment.aggregate';
import type { AppointmentRepository } from '../domain/appointment-repository';
import { injectOutboxTrace, withSpan, TRACING } from '../../shared/tracing/tracing';
import { cancelReasonOf, restoreAppointment, type BookingRow } from './prisma-appointment.repository.row';

@Injectable()
export class PrismaAppointmentRepository implements AppointmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  private db(): Prisma.TransactionClient {
    return currentDb() ?? (this.prisma as Prisma.TransactionClient);
  }

  async save(appointment: Appointment): Promise<void> {
    const db = this.db();
    const data: Prisma.BookingUpdateInput = {
      appointmentId: appointment.data.id,
      status: appointment.data.status,
    };
    if (appointment.data.status === 'cancelled') data.cancelReason = cancelReasonOf(appointment);
    // Референс/коментар (T-043): undefined — не чіпати, null — прибрати.
    if (appointment.data.haircutReferenceId !== undefined)
      data.haircutReferenceId = appointment.data.haircutReferenceId;
    if (appointment.data.appointmentComment !== undefined)
      data.appointmentComment = appointment.data.appointmentComment;
    await db.booking.update({ where: { id: appointment.data.bookingId }, data });
    const events = appointment.pullEvents();
    // Спан «події в outbox» всередині транзакції продюсера + W3C-карірування в
    // payload: релей продовжить трейс HTTP-запису, який породив подію.
    await withSpan({
      name: TRACING.OUTBOX_APPEND,
      options: { attributes: { [TRACING.EVENT_COUNT]: events.length } },
      work: async () => {
        await db.outboxMessage.createMany({
          data: events.map((event) => {
            // Каріруємо в копію payload: доменні об'єкти не мутуємо.
            const payload = { ...(event.payload as Record<string, unknown>) };
            injectOutboxTrace({ payload });
            return {
              id: uuidv7(),
              aggregateType: 'appointment',
              type: event.type,
              aggregateId: event.aggregateId,
              payload: payload as Prisma.InputJsonValue,
            };
          }),
        });
      },
    });
  }

  /** id тут — appointmentId АБО bookingId (до першого збереження appointmentId ще null). */
  async findById(id: string): Promise<Appointment | null> {
    const row = await this.db().booking.findFirst({
      where: { OR: [{ appointmentId: id }, { id }] },
    });
    return row ? restoreAppointment(row as BookingRow) : null;
  }

  async findByStatus(status: AppointmentStatus, onOrAfter: Date): Promise<Appointment[]> {
    const rows = await this.db().booking.findMany({ where: { status, start: { gte: onOrAfter } } });
    return (rows as BookingRow[]).map(restoreAppointment);
  }
}
