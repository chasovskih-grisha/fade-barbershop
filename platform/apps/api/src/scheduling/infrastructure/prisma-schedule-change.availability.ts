// T-4458: зайнятість запропонованого слота на момент згоди клієнта.
// Читаємо Booking напряму: конфлікт — інший активний запис того ж барбера,
// що перетинається зі слотом. Скасовані записи місце не займають.
import { Injectable } from '@nestjs/common';
import { prisma } from '../../index';
import type { ScheduleChangeAvailability } from '../application/schedule-change-approval.service';
import type { SlotRef } from '../domain/schedule-change-request';

interface BookingRow {
  barberId: string;
}

function slotBounds(slot: SlotRef): { start: Date; end: Date } {
  // Той самий контракт часу, що й у RescheduleAppointment (T-4533).
  return {
    start: new Date(`${slot.date}T${slot.start}:00.000Z`),
    end: new Date(`${slot.date}T${slot.end}:00.000Z`),
  };
}

@Injectable()
export class PrismaScheduleChangeAvailability implements ScheduleChangeAvailability {
  async isSlotAvailable(input: { appointmentId: string; slot: SlotRef }): Promise<boolean> {
    const booking = (await prisma.booking.findFirst({
      where: { OR: [{ id: input.appointmentId }, { appointmentId: input.appointmentId }] },
      select: { barberId: true },
    })) as BookingRow | null;
    if (!booking) return false;

    const { start, end } = slotBounds(input.slot);
    const conflict = (await prisma.booking.findFirst({
      where: {
        barberId: booking.barberId,
        id: { not: input.appointmentId },
        start: { lt: end },
        end: { gt: start },
        NOT: { status: 'cancelled' },
      },
      select: { id: true },
    })) as { id: string } | null;

    return conflict === null;
  }
}
