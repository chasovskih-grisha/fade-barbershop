import type { Prisma } from '@prisma/client';
import { AppointmentParty } from '../domain/appointment-party.entity';
import { Slot } from '../domain/slot.value-object';
import { PartyLeg } from '../domain/party-leg.entity';

type StoredSlot = { start: string; end: string };
type StoredLeg = {
  id: string;
  role: 'father' | 'son';
  name: string;
  age: number;
  barberId: string;
};

export type AppointmentPartyRow = {
  id: string;
  locationId: string | null;
  date: Date | null;
  mode: string | null;
  barberIds: string[];
  serviceId: string | null;
  agreedPriceId: string | null;
  agreedPrice: number | null;
  slots: Prisma.JsonValue | null;
  partyLegs: Prisma.JsonValue | null;
};

export function restoreAppointmentParty(row: AppointmentPartyRow): AppointmentParty {
  const slots = row.slots as StoredSlot[];
  const legs = row.partyLegs as StoredLeg[];
  return AppointmentParty.create({
    id: row.id,
    locationId: row.locationId ?? '',
    serviceId: row.serviceId ?? '',
    date: row.date ?? new Date(0),
    mode: row.mode as 'sequential' | 'parallel',
    barberIds: row.barberIds as [string, string],
    agreedPriceId: row.agreedPriceId ?? '',
    agreedPrice: row.agreedPrice ?? 0,
    slots: slots.map((slot) => Slot.create(new Date(slot.start), new Date(slot.end))),
    partyLegs: legs.map((leg) => PartyLeg.create(leg)),
  });
}

export function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
