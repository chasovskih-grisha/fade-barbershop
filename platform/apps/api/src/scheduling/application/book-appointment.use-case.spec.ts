import { Booking, BookingConflictError } from '../domain/booking';
import { BarberSchedule } from '../domain/availability';
import { BookAppointment } from './book-appointment.use-case';
import { FakeBookingRepository, FakeScheduleRepo, makeOpeningHours, slotOf } from './book-appointment.fakes';

const day = 0; // Monday
const date = '2026-10-05';
const opening = makeOpeningHours(day, '08:00', '20:00');
const schedule = (barberId: string) =>
  BarberSchedule.create({
    barberId,
    locationId: 'loc1',
    windows: [{ dayOfWeek: day, start: '09:00', end: '18:00' }],
  });
const slot = (start: string, end: string) => slotOf(start, end, date);

describe('BookAppointment', () => {
  it('books a valid slot with the requested barber and persists the actual date', async () => {
    const repository = new FakeBookingRepository('chairs');
    const useCase = new BookAppointment({
      bookingRepo: repository,
      scheduleRepo: new FakeScheduleRepo([schedule('b1')]),
      openingHours: opening,
      serviceDuration: 30,
    });
    const booking = await useCase.execute('b1', 'loc1', slot('09:15', '09:45'));
    expect(booking.barberId).toBe('b1');
    expect(booking.start.toISOString()).toBe(`${date}T09:15:00.000Z`);
  });

  it('rejects a date whose weekday does not match the supplied weekday', async () => {
    const useCase = new BookAppointment({
      bookingRepo: new FakeBookingRepository('chairs'),
      scheduleRepo: new FakeScheduleRepo([schedule('b1')]),
      openingHours: opening,
      serviceDuration: 30,
    });
    await expect(
      useCase.execute('b1', 'loc1', { ...slot('09:15', '09:45'), date: '2026-10-06' })
    ).rejects.toThrow('dayOfWeek does not match');
  });

  it('rejects a specific barber with an overlapping booking', async () => {
    const repository = new FakeBookingRepository('chairs');
    repository.bookings.push(
      Booking.create({
        barberId: 'b1',
        locationId: 'loc1',
        start: new Date(`${date}T09:00:00Z`),
        end: new Date(`${date}T09:30:00Z`),
      })
    );
    const useCase = new BookAppointment({
      bookingRepo: repository,
      scheduleRepo: new FakeScheduleRepo([schedule('b1')]),
      openingHours: opening,
      serviceDuration: 30,
    });
    await expect(useCase.execute('b1', 'loc1', slot('09:15', '09:45'))).rejects.toBeInstanceOf(
      BookingConflictError
    );
  });

  it('any-barber picks an available barber and skips one already booked', async () => {
    const repository = new FakeBookingRepository('chairs');
    repository.bookings.push(
      Booking.create({
        barberId: 'b1',
        locationId: 'loc1',
        start: new Date(`${date}T09:00:00Z`),
        end: new Date(`${date}T09:30:00Z`),
      })
    );
    const useCase = new BookAppointment({
      bookingRepo: repository,
      scheduleRepo: new FakeScheduleRepo([schedule('b1'), schedule('b2')]),
      openingHours: opening,
      serviceDuration: 30,
    });
    const booking = await useCase.execute('', 'loc1', slot('09:15', '09:45'));
    expect(booking.barberId).toBe('b2');
  });
});
