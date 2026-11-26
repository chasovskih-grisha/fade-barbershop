// Довідникові імена для карток кабінету: окремий модуль, щоб мапер рядка
// лишався про статуси й гроші, а не про три `findMany`.
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { BookingRow } from './client-appointments.view';

export type AppointmentNames = {
  service: Map<string, string>;
  barber: Map<string, string>;
  location: Map<string, string>;
};

export async function loadNames(
  prisma: PrismaService,
  rows: BookingRow[]
): Promise<AppointmentNames> {
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

function unique(values: Array<string | null>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}
