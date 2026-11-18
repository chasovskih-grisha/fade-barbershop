import { BarberSchedule } from '../domain/availability';
import { BookAppointment } from './book-appointment.use-case';
import {
  FakeBookingRepository,
  FakeScheduleRepo,
  makeOpeningHours,
  slotOf,
} from './book-appointment.fakes';

const opening = makeOpeningHours(0, '08:00', '20:00');
const windows = [{ dayOfWeek: 0, start: '09:00', end: '18:00' }];
const schedule = BarberSchedule.create({ barberId: 'b1', locationId: 'loc1', windows });
const slot = slotOf;

describe('BookAppointment error paths', () => {
  it('rejects a missing or malformed booking date', async () => {
    const useCase = new BookAppointment({
      bookingRepo: new FakeBookingRepository(),
      scheduleRepo: new FakeScheduleRepo([schedule]),
      openingHours: opening,
      serviceDuration: 30,
    });
    await expect(
      useCase.execute('b1', 'loc1', { dayOfWeek: 0, start: '09:15', end: '09:45' })
    ).rejects.toThrow('A booking date is required');
    await expect(
      useCase.execute('b1', 'loc1', { ...slot('09:15', '09:45'), date: '10/5' })
    ).rejects.toThrow('A booking date is required');
  });

  it('rejects a calendar-invalid date, e.g. month 13', async () => {
    const useCase = new BookAppointment({
      bookingRepo: new FakeBookingRepository(),
      scheduleRepo: new FakeScheduleRepo([schedule]),
      openingHours: opening,
      serviceDuration: 30,
    });
    await expect(
      useCase.execute('b1', 'loc1', { ...slot('09:15', '09:45'), date: '2026-13-05' })
    ).rejects.toThrow('Invalid booking date');
  });

  it('barberId with no schedule reports no availability', async () => {
    const useCase = new BookAppointment({
      bookingRepo: new FakeBookingRepository(),
      scheduleRepo: new FakeScheduleRepo([]),
      openingHours: opening,
      serviceDuration: 30,
    });
    await expect(useCase.execute('b1', 'loc1', slot('09:15', '09:45'))).rejects.toThrow(
      'Barber has no availability'
    );
  });

  it('any-barber with no usable schedule reports no availability', async () => {
    const useCase = new BookAppointment({
      bookingRepo: new FakeBookingRepository(),
      scheduleRepo: new FakeScheduleRepo([]),
      openingHours: opening,
      serviceDuration: 30,
    });
    await expect(useCase.execute('', 'loc1', slot('09:15', '09:45'))).rejects.toThrow(
      'No barber is available'
    );
  });
});
