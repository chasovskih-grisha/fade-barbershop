// План демо-записів (T-2104c) і upsert одного booking — для seed-appointments.ts.
import { uuidv7 } from '@fade/domain-shared';
import { depositTermsFor } from '../../src/scheduling/domain/deposit-terms';
import { id, prisma } from './db';

const MIN = 60_000;

interface Refs {
  locations: Array<{ id: string; code: string }>;
  barbers: Array<{ id: string }>;
  /** Рядки prisma.service.findMany (loadRefs), не обгортка seedServices. */
  services: Array<{ id: string; duration: number; parallelDuration: number | null }>;
  customers: Array<{ id: string | null }>;
}

/** Легенда демо-даних: статус/джерело/зсув від «зараз»/послуга/клієнт. */
export function appointmentPlan(
  refs: Refs
): Array<
  [
    string,
    string,
    string,
    Date,
    { id: string; duration: number; parallelDuration: number | null },
    string | null,
    string | null,
  ]
> {
  // noUncheckedIndexedAccess: масиви нумеровані, тож фолбек + явна перевірка.
  const fallback = refs.services[0];
  if (!fallback) throw new Error('[seed-appointments] порожній список послуг');
  const haircut = refs.services.find((s) => s.duration === 30) ?? fallback;
  const beard = refs.services.find((s) => s.duration === 20) ?? fallback;
  const combo = refs.services.find((s) => s.parallelDuration) ?? fallback;
  const day = (n: number) => n * 24 * 60 * MIN;
  const at = (base: Date, h: number, m = 0) => {
    const d = new Date(base);
    d.setHours(h, m, 0, 0);
    return d;
  };
  const today = new Date();
  const client = (i: number) => refs.customers[i % refs.customers.length]?.id ?? null;
  // Кожен рядок: [appointmentId, статус, джерело, початок, послуга, clientId, cancelReason?]
  // prettier-ignore
  return [
    ['apt_seed_001', 'booked', 'web', at(new Date(today.getTime() + day(1)), 10), haircut, client(0), null],
    ['apt_seed_002', 'confirmed', 'web', at(new Date(today.getTime() + day(1)), 12), haircut, client(1), null],
    ['apt_seed_003', 'booked', 'mobile', at(new Date(today.getTime() + day(2)), 11), beard, client(2), null],
    ['apt_seed_004', 'confirmed', 'admin', at(new Date(today.getTime() + day(2)), 15), beard, null, null],
    ['apt_seed_005', 'in_progress', 'walk_in', new Date(Date.now() - 10 * MIN), combo, client(3), null],
    ['apt_seed_006', 'completed', 'web', at(new Date(today.getTime() - day(1)), 10), haircut, client(0), null],
    ['apt_seed_007', 'completed', 'web', at(new Date(today.getTime() - day(1)), 13), beard, client(1), null],
    ['apt_seed_008', 'completed', 'mobile', at(new Date(today.getTime() - day(2)), 11), haircut, client(2), null],
    ['apt_seed_009', 'no_show', 'web', at(new Date(today.getTime() - day(2)), 16), beard, client(3), null],
    ['apt_seed_010', 'cancelled', 'web', at(new Date(today.getTime() - day(3)), 12), haircut, client(1), 'client_changed_mind'],
    ['apt_seed_011', 'cancelled', 'admin', at(new Date(today.getTime() + day(3)), 14), combo, client(2), 'slot_conflict'],
    ['apt_seed_012', 'completed', 'admin', at(new Date(today.getTime() - day(3)), 15), combo, null, null],
    ['apt_seed_013', 'booked', 'mobile', at(new Date(today.getTime() + day(1)), 14), haircut, client(4), null],
    ['apt_seed_014', 'confirmed', 'web', at(new Date(today.getTime() + day(2)), 9), combo, client(5), null],
    ['apt_seed_015', 'completed', 'web', at(new Date(today.getTime() - day(4)), 11), haircut, client(6), null],
    ['apt_seed_016', 'completed', 'admin', at(new Date(today.getTime() - day(4)), 16), beard, client(7), null],
  ];
}

/** Один запис: update за appointmentId або create з bk_-id → 'created'|'updated'. */
export async function upsertBooking(
  refs: Refs,
  i: number,
  row: [
    string,
    string,
    string,
    Date,
    { id: string; duration: number; parallelDuration: number | null },
    string | null,
    string | null,
  ]
): Promise<'created' | 'updated'> {
  const [appointmentId, status, source, start, service, clientId, cancelReason] = row;
  const barber = refs.barbers[i % refs.barbers.length];
  const location = refs.locations[i % refs.locations.length];
  if (!barber || !location) {
    throw new Error('[seed-appointments] порожні довідники барберів/локацій');
  }
  const price = await prisma.servicePrice.findFirst({
    where: { serviceId: service.id, locationId: location.id, active: true },
  });
  const end = new Date(start.getTime() + service.duration * MIN);
  // Умови депозиту — той самий снепшот, що пише Booking (PAY-ADM-09).
  const deposit = depositTermsFor(price?.amount ?? null);
  const data = {
    barberId: barber.id,
    locationId: location.id,
    serviceId: service.id,
    agreedPrice: price?.amount ?? null,
    fulfillmentMode: service.parallelDuration ? 'parallel' : 'sequential',
    start,
    end,
    status,
    cancelReason: status === 'cancelled' ? cancelReason : null,
    clientId,
    source,
    depositAmount: deposit?.amount ?? null,
    depositPercent: deposit?.percent ?? null,
    depositRounding: deposit?.rounding ?? null,
    cancellationWindowHours: deposit?.cancellationWindowHours ?? null,
  };
  const existing = await prisma.booking.findUnique({ where: { appointmentId } });
  if (existing) {
    await prisma.booking.update({
      where: { id: existing.id },
      data: { ...data, version: existing.version },
    });
    return 'updated';
  }
  const bookingId = id(`bk_${appointmentId.replace('apt_', '')}`);
  await prisma.booking.create({
    // FIXED_IDS-режим — детермінований id (uuid), поза ним — свіжий UUID v7.
    data: { id: bookingId ?? uuidv7(), appointmentId, version: 1, ...data },
  });
  return 'created';
}
