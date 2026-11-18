import { AppointmentParty, AppointmentMode } from '../domain/appointment-party.entity';
import type { AppointmentPartyRepository } from './ports';

export class InMemoryAppointmentPartyRepository implements AppointmentPartyRepository {
  parties = new Map<string, AppointmentParty>();
  async save(party: AppointmentParty): Promise<void> {
    this.parties.set(party.id, party);
  }
  async findById(id: string): Promise<AppointmentParty | null> {
    return this.parties.get(id) ?? null;
  }
  async findByDate(date: Date): Promise<AppointmentParty[]> {
    return Array.from(this.parties.values()).filter(
      (p) => p.date.toISOString() === date.toISOString()
    );
  }
}

/** Базовий валідний ввід (father+son): mode/slots/barberIds — по групі тесту. */
export function baseInput() {
  return {
    locationId: 'location-1',
    serviceId: 'father-son',
    date: new Date('2026-10-01T00:00:00Z'),
    barberIds: ['barber-1', 'barber-1'] as [string, string],
    slots: [{ start: new Date('2026-10-01T09:00:00Z'), end: new Date('2026-10-01T10:30:00Z') }],
    partyLegs: [
      { id: 'leg-1', role: 'father' as const, name: 'Father', age: 40, barberId: 'barber-1' },
      { id: 'leg-2', role: 'son' as const, name: 'Son', age: 10, barberId: 'barber-1' },
    ],
    agreedPriceId: 'price-123',
    agreedPrice: 900,
  };
}

/** sequential = baseInput + режим 90-хвилинного спільного слота. */
export function sequentialInput() {
  return { ...baseInput(), mode: 'sequential' as AppointmentMode };
}

export function parallelInput() {
  return {
    ...baseInput(),
    mode: 'parallel' as AppointmentMode,
    barberIds: ['barber-1', 'barber-2'] as [string, string],
    slots: [
      { start: new Date('2026-10-01T09:00:00Z'), end: new Date('2026-10-01T09:50:00Z') },
      { start: new Date('2026-10-01T09:00:00Z'), end: new Date('2026-10-01T09:45:00Z') },
    ],
    partyLegs: [
      { id: 'leg-1', role: 'father' as const, name: 'Father', age: 40, barberId: 'barber-1' },
      { id: 'leg-2', role: 'son' as const, name: 'Son', age: 10, barberId: 'barber-2' },
    ],
  };
}
