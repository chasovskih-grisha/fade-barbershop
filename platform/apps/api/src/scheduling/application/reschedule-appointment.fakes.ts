// Спільні фейки спеки RescheduleAppointment (T-4533): репозиторій у пам'яті,
// фабрика живого запису, mover-записувач, типова команда. Атомарність mover
// перевіряє race-e2e на Postgres, тут — лише контракт викликів.
import { RescheduleAppointment } from './reschedule-appointment.use-case';
import type { AppointmentTimeMover, MoveTimeQuery } from './reschedule-appointment.types';
import { Appointment } from '../domain/appointment.aggregate';
import type { AppointmentRepository } from '../domain/appointment-repository';
import { BarberSchedule } from '../domain/availability';
import { OpeningHours } from '../../locations/domain/opening-hours';
import { weekDays } from '../../locations/test-helpers.fakes';

export const T0 = new Date('2026-11-02T09:00:00Z');

// prettier-ignore
export const fakeRepo = (store: Map<string, Appointment>): AppointmentRepository => ({
  save: async (appointment) => void store.set(appointment.data.id, appointment),
  findById: async (id) => store.get(id) ?? null,
  findByStatus: async () => [...store.values()],
});

// prettier-ignore
export const booked = (start = '10:00', end = '10:30') => Appointment.book({ id: 'apt-1', bookingId: 'bk-1', locationId: 'loc-1', barberId: 'barber-1', start, end }, T0);

// prettier-ignore
export const okMover = (): AppointmentTimeMover => ({ moveTime: async () => ({ oldStart: new Date(), oldEnd: new Date() }) });

// prettier-ignore
export const okSchedule = { findByBarberAndLocation: async () => BarberSchedule.create({ barberId: 'barber-1', locationId: 'loc-1', windows: [{ dayOfWeek: 0, start: '09:00', end: '17:00' }] }) };

// prettier-ignore
export const okLocation = { findById: async () => ({ hours: OpeningHours.of(weekDays()) }) };

export function setup(initial: Appointment, mover: AppointmentTimeMover = okMover()) {
  const store = new Map<string, Appointment>([[initial.data.id, initial]]);
  const moves: MoveTimeQuery[] = [];
  const recordingMover: AppointmentTimeMover = {
    moveTime: async (q) => {
      moves.push(q);
      return mover.moveTime(q);
    },
  };
  const useCase = new RescheduleAppointment({
    appointments: fakeRepo(store),
    scheduleRepo: okSchedule,
    locationRepo: okLocation,
    mover: recordingMover,
  });
  return { useCase, moves };
}

// prettier-ignore
export const cmd = (overrides: object = {}) => ({ appointmentId: 'apt-1', actorId: 'admin-1', actorRole: 'admin' as const, date: '2026-11-02', start: '11:00', end: '11:30', ...overrides });
