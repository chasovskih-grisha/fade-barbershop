import { Booking } from '../domain/booking';
import { BookingRepository } from '../domain/booking-repository';
import { BarberSchedule } from '../domain/availability';
import { OpeningHours } from '../../locations/domain/opening-hours';
import { BookAppointment } from './book-appointment.use-case';
import { FakeBookingRepository, FakeScheduleRepo, makeOpeningHours, slotOf } from './book-appointment.fakes';

const opening = makeOpeningHours(0, '08:00', '20:00');
const windows = [{ dayOfWeek: 0, start: '09:00', end: '18:00' }];
const schedule = BarberSchedule.create({ barberId: 'b1', locationId: 'loc1', windows });
const slot = slotOf;

describe('BookAppointment error paths — save/validator', () => {
  it('rethrows a non-conflict save error', async () => {
    const repo: BookingRepository = {
      save: async () => {
        throw new Error('db down');
      },
      findBarberOverlaps: async () => [],
      findOverlaps: async () => [],
      findAllOverlaps: async () => [],
      findForBarberAtLocation: async () => [],
    };
    const useCase = new BookAppointment({
      bookingRepo: repo,
      scheduleRepo: new FakeScheduleRepo([schedule]),
      openingHours: opening,
      serviceDuration: 30,
    });
    await expect(useCase.execute('b1', 'loc1', slot('09:15', '09:45'))).rejects.toThrow('db down');
  });

  it('propagates an unexpected validator error', async () => {
    const useCase = new BookAppointment({
      bookingRepo: new FakeBookingRepository(),
      scheduleRepo: new FakeScheduleRepo([schedule]),
      openingHours: undefined as unknown as OpeningHours,
      serviceDuration: 30,
    });
    await expect(useCase.execute('b1', 'loc1', slot('09:15', '09:45'))).rejects.toThrow();
  });

  it('any-barber saves a slot successfully when a scheduled barber has no overlap', async () => {
    const saved: Booking[] = [];
    const repo: BookingRepository = {
      save: async (b) => {
        saved.push(b);
      },
      findBarberOverlaps: async () => [],
      findOverlaps: async () => [],
      findAllOverlaps: async () => [],
      findForBarberAtLocation: async () => [],
    };
    const useCase = new BookAppointment({
      bookingRepo: repo,
      scheduleRepo: new FakeScheduleRepo([schedule]),
      openingHours: opening,
      serviceDuration: 30,
    });
    const booking = await useCase.execute('', 'loc1', slot('10:00', '10:30'));
    expect(saved.map((b) => b.barberId)).toEqual(['b1']);
    expect(booking.barberId).toBe('b1');
  });
});
