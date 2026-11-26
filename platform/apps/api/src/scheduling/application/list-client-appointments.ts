/* eslint-disable max-lines -- мапер + запит утримань/повернень/довідників лишаються поруч: порт один, рознесення сховало б, що читається одним проходом */
// Read-модель «Мої візити» (web-cabinet-screens §3): рядки Booking клієнта
// з іменами послуги, барбера і локації. Форми і словник статусів —
// у client-appointments.view.ts.

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { kyivStamp } from './kyiv-stamp';
import { loadNames, type AppointmentNames } from './client-appointment-names';
import { toClientDeposit } from './client-appointment-deposit';
import {
  CABINET_STATUS,
  type BookingRow,
  type ClientAppointmentView,
} from './client-appointments.view';

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
      return toView({ row, names, ...(hold ? { hold } : {}), ...(refund ? { refund } : {}) });
    });
  }
}

function toView(input: {
  row: BookingRow;
  names: AppointmentNames;
  hold?: { expiresAt: Date; status: string };
  refund?: { status: string; amount: number | null };
}): ClientAppointmentView {
  const { row, names, hold, refund } = input;
  const stamp = kyivStamp(row.start);
  const domainStatus = row.status ?? 'booked';
  return {
    id: row.appointmentId ?? row.id,
    date: stamp.date,
    startTime: stamp.time,
    endTime: kyivStamp(row.end).time,
    // ISO-моменти для календарних посилань (T-4446): кабінет не рахує їх сам.
    startsAt: row.start.toISOString(),
    endsAt: row.end.toISOString(),
    serviceName: names.service.get(row.serviceId ?? '') ?? '',
    barberName: names.barber.get(row.barberId) ?? '',
    locationName: names.location.get(row.locationId) ?? '',
    price: row.agreedPrice ?? 0,
    status: CABINET_STATUS[domainStatus] ?? 'upcoming',
    source: bookingSourceOf(row),
    // Тільки ID: фото лежить у приватному бакеті (ADR 0008 §2), підписаний
    // URL клієнт отримує з GET /booking/reference-photos/:id (REF-WEB-03).
    referenceId: row.haircutReferenceId,
    referenceComment: row.appointmentComment ?? '',
    canEditReference: domainStatus === 'booked',
    canBookAgain: row.partyId === null,
    // T-4616a: причина скасування приходить із рядка візиту, а не з UI.
    cancelReason: row.cancelReason ?? null,
    // Депозит із снепшота візиту (PAY-ADM-09); діалог скасування читає лише його.
    deposit: toClientDeposit(row, hold, refund),
  };
}

/** ANL-004: рядки без каналу — старі онлайн-записи, не «без джерела». */
function bookingSourceOf(row: BookingRow): string {
  return row.source ?? 'web';
}
