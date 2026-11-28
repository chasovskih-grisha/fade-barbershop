// Read-модель «Мої візити» (web-cabinet-screens §3): рядки Booking клієнта
// з іменами послуги, барбера і локації. Форми і словник статусів — у
// client-appointments.view.ts, мапер рядка — у client-appointments-row.ts.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { loadNames } from './client-appointment-names';
import { toClientAppointmentView } from './client-appointments-row';
import type { ClientAppointmentView } from './client-appointments.view';

export type { CabinetStatus, ClientAppointmentView } from './client-appointments.view';

@Injectable()
export class ListClientAppointments {
  constructor(private readonly prisma: PrismaService) {}

  async handle(
    userId: string,
    perspective: 'client' | 'barber' = 'client'
  ): Promise<ClientAppointmentView[]> {
    const rows = await this.prisma.booking.findMany({
      where: perspective === 'barber' ? { barberId: userId } : { clientId: userId },
      orderBy: { start: 'desc' },
    });
    if (rows.length === 0) return [];
    const bookingIds = rows.map((row) => row.id);
    const [names, holds, refunds] = await Promise.all([
      loadNames(this.prisma, rows),
      this.prisma.depositHold.findMany({
        where: { appointmentId: { in: bookingIds } },
        select: { appointmentId: true, expiresAt: true, status: true },
      }),
      // T-094: стан повернення живе в BookingPaymentState, не в booking.
      this.prisma.bookingPaymentState.findMany({
        where: { bookingId: { in: bookingIds }, refundStatus: { not: null } },
        select: { bookingId: true, refundStatus: true, capturedRefundAmount: true },
      }),
    ]);
    const holdByBooking = new Map(holds.map((hold) => [hold.appointmentId, hold]));
    const refundByBooking = new Map(
      refunds.map((refund) => [
        refund.bookingId,
        {
          status: refund.refundStatus as string,
          amount: refund.capturedRefundAmount ?? null,
        },
      ])
    );
    return rows.map((row) => {
      const hold = holdByBooking.get(row.id);
      const refund = refundByBooking.get(row.id);
      return toClientAppointmentView({
        row,
        names,
        ...(hold ? { hold } : {}),
        ...(refund ? { refund } : {}),
      });
    });
  }
}
