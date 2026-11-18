// Read-модель «Мої візити» (web-cabinet-screens §3): рядки Booking клієнта
// з іменами послуги, барбера і локації. Форми і словник статусів —
// у client-appointments.view.ts.

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { kyivStamp } from './kyiv-stamp';
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

  async handle(userId: string): Promise<ClientAppointmentView[]> {
    const rows = await this.prisma.booking.findMany({
      where: { clientId: userId },
      orderBy: { start: 'desc' },
    });
    if (rows.length === 0) return [];
    const names = await loadNames(this.prisma, rows);
    return rows.map((row) => toView(row, names));
  }
}

async function loadNames(prisma: PrismaService, rows: BookingRow[]) {
  const serviceIds = unique(rows.map((row) => row.serviceId));
  const barberIds = unique(rows.map((row) => row.barberId));
  const locationIds = unique(rows.map((row) => row.locationId));
  const [services, barbers, locations] = await Promise.all([
    prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({ where: { id: { in: barberIds } }, select: { id: true, name: true } }),
    prisma.location.findMany({
      where: { id: { in: locationIds } },
      select: { id: true, name: true },
    }),
  ]);
  return {
    service: new Map(services.map((row) => [row.id, row.name])),
    barber: new Map(barbers.map((row) => [row.id, row.name ?? ''])),
    location: new Map(locations.map((row) => [row.id, row.name])),
  };
}

function toView(
  row: BookingRow,
  names: Awaited<ReturnType<typeof loadNames>>
): ClientAppointmentView {
  const stamp = kyivStamp(row.start);
  const domainStatus = row.status ?? 'booked';
  return {
    id: row.appointmentId ?? row.id,
    date: stamp.date,
    startTime: stamp.time,
    endTime: kyivStamp(row.end).time,
    serviceName: names.service.get(row.serviceId ?? '') ?? '',
    barberName: names.barber.get(row.barberId) ?? '',
    locationName: names.location.get(row.locationId) ?? '',
    price: row.agreedPrice ?? 0,
    status: CABINET_STATUS[domainStatus] ?? 'upcoming',
    // Тільки ID: фото лежить у приватному бакеті (ADR 0008 §2), підписаний
    // URL клієнт отримує з GET /booking/reference-photos/:id (REF-WEB-03).
    referenceId: row.haircutReferenceId,
    referenceComment: row.appointmentComment ?? '',
    canEditReference: domainStatus === 'booked',
    // Депозит із снепшота візиту (PAY-ADM-09); діалог скасування читає лише його.
    deposit: toClientDeposit(row),
  };
}

function unique(values: Array<string | null>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}
