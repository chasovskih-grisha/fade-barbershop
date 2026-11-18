// Фейки спеки T-043/T-046: репозиторій у пам'яті, графік барбера, збірка
// BookAppointment зі снепшотами reference/origin.
import { BookAppointment } from './book-appointment.use-case';
import { BookingConflictError } from '../domain/booking';
import { BarberSchedule } from '../domain/availability';
import { OpeningHours } from '../../locations/domain/opening-hours';
import type { BookingRepository } from '../domain/booking-repository';
import { weekDays } from '../../locations/test-helpers.fakes';

// prettier-ignore
export const fakeRepo = (conflict = false): BookingRepository => ({
  save: async () => { if (conflict) throw new BookingConflictError('barber busy'); },
  findOverlaps: async () => [],
  findAllOverlaps: async () => [],
  findForBarberAtLocation: async () => [],
  findBarberOverlaps: async () => [],
});

export const schedule = () =>
  BarberSchedule.create({
    barberId: 'barber-1',
    locationId: 'loc-1',
    windows: [{ dayOfWeek: 0, start: '09:00', end: '17:00' }],
  });

export const slot = { date: '2026-11-02', dayOfWeek: 0, start: '10:00', end: '10:30' };

export type Snapshot = {
  reference?: { haircutReferenceId?: string; appointmentComment?: string };
  origin?: { clientId?: string; source?: 'web' | 'admin' | 'walk_in' | 'mobile' };
};

export const useCase = (repo: BookingRepository, snapshot?: Snapshot) =>
  new BookAppointment({
    bookingRepo: repo,
    scheduleRepo: {
      findByBarberAndLocation: async () => schedule(),
      listAllByLocation: async () => [schedule()],
    },
    openingHours: OpeningHours.of(weekDays()),
    serviceDuration: 30,
    ...(snapshot?.reference ? { reference: snapshot.reference } : {}),
    ...(snapshot?.origin ? { origin: snapshot.origin } : {}),
  });
