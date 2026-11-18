// Shared fakes for AvailableSlots specs (T-4521/T-4522): fixed clock,
// in-memory repos, default location 09:00-20:00, barbers b1/b2 work Monday.
// Separate file (gates max-lines / coverage).

import { createLocation } from '../../locations/test-helpers.fakes';
import { BarberSchedule } from '../../scheduling/domain/availability';
import { Booking } from '../../scheduling/domain/booking';
import { AvailableSlots } from './available-slots';
import type { SlotPolicyRow } from '../../scheduling/domain/ports.slot-policy';

// prettier-ignore
const barber = (id: string, active = true) => ({ id, role: 'barber', active, name: id, phone: { value: `+380${id}` } });

export const SLOT_REQUEST = { locationId: 'loc-1', date: '2026-10-05', serviceId: 'service-1' };

export interface SlotsFakes {
  bookings?: Booking[];
  policy?: Partial<Omit<SlotPolicyRow, 'id' | 'locationId'>> | null;
  matrix?: Map<string, Map<string, Set<string>>>;
  now?: string;
}

export function makeSlots(options: SlotsFakes = {}): AvailableSlots {
  const bookings = options.bookings ?? [];
  const matrix = options.matrix ?? new Map<string, Map<string, Set<string>>>();
  const now = new Date(options.now ?? '2026-10-04T12:00:00.000Z');
  const policy: SlotPolicyRow | null =
    options.policy == null
      ? null
      : {
          id: 'p1',
          locationId: 'loc-1',
          stepMinutes: 15,
          bufferMinutes: 0,
          horizonDays: 14,
          lastMinuteMinutes: 60,
          timeZone: 'Europe/Kyiv',
          ...options.policy,
        };
  // prettier-ignore
  const schedules = ['b1', 'b2'].map((id) => BarberSchedule.create({ barberId: id, locationId: 'loc-1', windows: [{ dayOfWeek: 0, start: '09:00', end: '17:00' }] }));
  const deps = {
    bookingRepo: { findAllOverlaps: async () => bookings } as never,
    scheduleRepo: {
      findByBarberAndLocation: (id: string) =>
        schedules.find((s) => s.getBarberId() === id) ?? null,
      listAllByLocation: async () => schedules,
    } as never,
    locationRepo: {
      findById: async () => createLocation({ id: 'loc-1' }),
      listActive: async () => [],
    } as never,
    userRepo: {
      listByRole: async () => [barber('b1'), barber('b2'), barber('b3'), barber('inact', false)],
    } as never,
    serviceRepo: {
      catalogForLocation: async () => [{ id: 'service-1', duration: 30, price: 300 }],
    } as never,
    assignmentRepo: { snapshotForLocation: async () => ({ matrix }) } as never,
    slotPolicyRepo: { forLocation: async () => policy, save: async () => undefined } as never,
    clock: { now: () => now },
  };
  return new AvailableSlots(deps);
}
