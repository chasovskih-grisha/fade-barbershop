import type { Prisma } from '@prisma/client';
import { AppointmentParty } from '../domain/appointment-party.entity';
import { Slot } from '../domain/slot.value-object';
import { PartyLeg } from '../domain/party-leg.entity';
import { asJson } from './appointment-party-row';

export function partySpan(party: AppointmentParty): { windowStart: Date; windowEnd: Date } {
  const starts = party.slots.map((slot) => slot.start.getTime());
  const ends = party.slots.map((slot) => slot.end.getTime());
  return { windowStart: new Date(Math.min(...starts)), windowEnd: new Date(Math.max(...ends)) };
}

export function legsOf(
  party: AppointmentParty
): Array<{ slot: Slot | undefined; leg: PartyLeg | undefined; partyRole: string }> {
  return party.mode === 'sequential'
    ? [{ slot: party.slots[0], leg: party.partyLegs[0], partyRole: 'party' }]
    : party.partyLegs.map((leg, index) => ({
        slot: party.slots[index],
        leg,
        partyRole: leg.role,
      }));
}

export function assertPartyCapacity(
  existing: Array<{ start: Date; end: Date }>,
  requested: Array<{ start: Date; end: Date }>,
  chairs: number
): void {
  const intervals = [...existing, ...requested];
  const points = [...new Set(intervals.map((interval) => interval.start.getTime()))];
  if (
    points.some(
      (point) =>
        intervals.filter(
          (interval) => interval.start.getTime() <= point && interval.end.getTime() > point
        ).length > chairs
    )
  ) {
    throw new Error('No free chairs for party');
  }
}

export async function assertLegsFree(
  tx: Prisma.TransactionClient,
  legs: Array<{ slot: Slot | undefined; leg: PartyLeg | undefined }>
): Promise<void> {
  for (const { slot, leg } of legs) {
    if (!slot || !leg) throw new Error('Party legs and slots do not match');
    const conflict = await tx.booking.findFirst({
      where: { barberId: leg.barberId, start: { lt: slot.end }, end: { gt: slot.start } },
      select: { id: true },
    });
    if (conflict) throw new Error(`Barber ${leg.barberId} is already booked for this time`);
  }
}

export function partyCreateData(party: AppointmentParty) {
  return {
    id: party.id,
    role: 'party' as const,
    locationId: party.locationId,
    date: party.date,
    mode: party.mode,
    barberIds: party.barberIds,
    serviceId: party.serviceId,
    agreedPriceId: party.agreedPriceId,
    agreedPrice: party.agreedPrice,
    slots: asJson(
      party.slots.map((slot) => ({
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
      }))
    ),
    partyLegs: asJson(
      party.partyLegs.map((leg) => ({
        id: leg.id,
        role: leg.role,
        name: leg.name,
        age: leg.age,
        barberId: leg.barberId,
      }))
    ),
  };
}
