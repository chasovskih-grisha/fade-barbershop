// Тіло атомарного переносу часу Appointment (T-4533) всередині транзакції:
// читання старих часів, конфлікт барбера, поріг активних крісел (як у T-040c,
// sweep-line hasChairCapacity), update + подія rescheduled в outbox.
// Ізоляція/мапінг P2034 — у PrismaAppointmentTimeMover.
import { uuidv7 } from '@fade/domain-shared';
import type { Prisma } from '@prisma/client';
import { BookingConflictError } from '../domain/booking';
import { hasChairCapacity, type BookingInterval } from '../domain/chair-capacity';
import { injectOutboxTrace, withSpan, TRACING } from '../../shared/tracing/tracing';
import type { MoveTimeQuery } from '../application/reschedule-appointment.types';

export async function persistMoveTime(
  db: Prisma.TransactionClient,
  query: MoveTimeQuery
): Promise<{ oldStart: Date; oldEnd: Date } | null> {
  const current = await db.booking.findFirst({
    where: { OR: [{ appointmentId: query.appointmentId }, { id: query.appointmentId }] },
    select: { id: true, barberId: true, locationId: true, start: true, end: true },
  });
  if (!current) return null;
  const barberId = query.newBarberId ?? current.barberId;
  const conflict = await db.booking.findFirst({
    where: {
      barberId,
      start: { lt: query.newEnd },
      end: { gt: query.newStart },
      id: { not: current.id },
    },
    select: { id: true },
  });
  if (conflict) throw new BookingConflictError('Barber is already booked for this slot');
  const [dayStart, dayEnd] = dayBounds(query.newStart);
  const rows = (await db.booking.findMany({
    where: {
      locationId: current.locationId,
      start: { lt: dayEnd },
      end: { gt: dayStart },
      id: { not: current.id },
    },
    select: { start: true, end: true },
  })) as BookingInterval[];
  const chairs = await db.chair.count({
    where: { locationId: current.locationId, active: true },
  });
  if (!hasChairCapacity({ existing: rows, start: query.newStart, end: query.newEnd, chairs })) {
    throw new BookingConflictError('No free chairs for this slot');
  }
  await db.booking.update({
    where: { id: current.id },
    data: {
      start: query.newStart,
      end: query.newEnd,
      ...(query.newBarberId ? { barberId: query.newBarberId } : {}),
      version: { increment: 1 },
    },
  });
  // Старі часи — точні ISO з БД (агрегат зберігає лише HH:mm). Спан «подія в
  // outbox» + W3C-каріювання (T-4204) — той самий патерн, що й для booked у
  // repository.save: обробка rescheduled релеєм продовжить трейс запиту.
  await withSpan({
    name: TRACING.OUTBOX_APPEND,
    options: { attributes: { [TRACING.EVENT_COUNT]: 1 } },
    work: async () => {
      const payload = {
        ...query.event.payload,
        oldStart: current.start.toISOString(),
        oldEnd: current.end.toISOString(),
        ...(query.newBarberId ? { oldBarberId: current.barberId } : {}),
      };
      injectOutboxTrace({ payload });
      await db.outboxMessage.create({
        data: {
          id: uuidv7(),
          aggregateType: 'appointment',
          aggregateId: query.appointmentId,
          type: query.event.type,
          payload,
        },
      });
    },
  });
  return { oldStart: current.start, oldEnd: current.end };
}

/** Межі доби нового слота (UTC): [00:00 дня start, 00:00 наступного). */
function dayBounds(newStart: Date): [Date, Date] {
  const dayEnd = new Date(newStart.getTime());
  dayEnd.setUTCHours(24, 0, 0, 0);
  const dayStart = new Date(
    Date.UTC(dayEnd.getUTCFullYear(), dayEnd.getUTCMonth(), dayEnd.getUTCDate() - 1)
  );
  return [dayStart, dayEnd];
}
