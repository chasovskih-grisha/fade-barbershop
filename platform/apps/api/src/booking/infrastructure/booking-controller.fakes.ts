// Збірка BookingController на фейках для спек (T-041/T-4522): репозиторії
// локацій/барберів/сервісів/розкладів у пам'яті + фіксований годинник.
// Окремо від *.spec.ts — LOC-гейт і спільне використання.
import { BookingController } from './booking.controller';
import { BookingReader } from './booking.reader';
import { AvailableSlots } from './available-slots';
import { createLocation } from '../../locations/test-helpers.fakes';
import { BarberSchedule } from '../../scheduling/domain/availability';
import { Booking } from '../../scheduling/domain/booking';

// prettier-ignore
const barber = (id: string, active = true) => ({ id, role: 'barber', active, name: id, phone: { value: `+380${id}` } });

/** Контролер із фейковими репозиторіями; bookings — наявні візити локації. */
export function makeBookingController(bookings: Booking[] = [], assignedIds = ['b1', 'b2']) {
  // prettier-ignore
  const schedules = ['b1', 'b2'].map((id) => BarberSchedule.create({ barberId: id, locationId: 'loc-1', windows: [{ dayOfWeek: 0, start: '09:00', end: '17:00' }] }));
  const mine = (b: Booking) => b.locationId === 'loc-1';
  const ovl = (s: Date, e: Date) => bookings.filter((b) => b.start < e && b.end > s && mine(b));
  const bookingRepo = { findAllOverlaps: async (s: Date, e: Date) => ovl(s, e) } as never;
  const byId = (id: string) => schedules.find((s) => s.getBarberId() === id) ?? null;
  const scheduleRepo = {
    findByBarberAndLocation: (id: string) => byId(id),
    listAllByLocation: async () => schedules,
  } as never;
  const loc = createLocation({ id: 'loc-1' });
  const locationRepo = {
    findById: async () => loc,
    listActive: async () => [],
  } as never;
  const userRepo = {
    listByRole: async () => [barber('b1'), barber('b2'), barber('b3'), barber('inact', false)],
  } as never;
  const staffRepo = {
    listByLocation: async () => assignedIds.map((id) => ({ barberId: id })),
  } as never;
  const svc = [{ id: 'service-1', duration: 30, price: 300 }];
  const serviceRepo = {
    catalogForLocation: async () => svc,
  } as never;
  // T-4522: matrix + slot policy fakes (порожня matrix → фолбек на призначених).
  const assignmentRepo = {
    snapshotForLocation: async () => ({ matrix: new Map() }),
  } as never;
  const slotPolicyRepo = {
    forLocation: async () => null,
    save: async () => undefined,
  } as never;
  // T-4522: фіксований годинник — горизонт/last-minute не залежать від стінного часу.
  const clock = { now: () => new Date('2026-10-04T12:00:00.000Z') };
  const readerDeps = { locationRepo, userRepo, serviceRepo, staffAssignments: staffRepo };
  const reader = new BookingReader(readerDeps);
  const slotDeps = {
    bookingRepo,
    scheduleRepo,
    locationRepo,
    userRepo,
    serviceRepo,
    assignmentRepo,
    slotPolicyRepo,
    clock,
  };
  return new BookingController(reader, new AvailableSlots(slotDeps));
}

/** Типовий запит слотів: понеділок loc-1, послуга service-1. */
export const SLOT_REQUEST = { locationId: 'loc-1', date: '2026-10-05', serviceId: 'service-1' };
