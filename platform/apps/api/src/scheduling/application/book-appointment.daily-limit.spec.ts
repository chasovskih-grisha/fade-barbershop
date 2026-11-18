import { Booking, BookingConflictError } from '../domain/booking';
import { BarberSchedule } from '../domain/availability';
import { BookAppointment } from './book-appointment.use-case';
import {
  FakeBookingRepository,
  FakeScheduleRepo,
  makeOpeningHours,
  slotOf,
} from './book-appointment.fakes';

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

const repositoryWithOneBooking = () => {
  const repository = new FakeBookingRepository('chairs');
  repository.bookings.push(
    Booking.create({
      barberId: 'b1',
      locationId: 'loc1',
      start: new Date(`${date}T09:00:00Z`),
      end: new Date(`${date}T09:30:00Z`),
    })
  );
  return repository;
};

describe('BookAppointment daily load limit (T-4421)', () => {
  it('any-barber skips a barber who reached the daily load limit', async () => {
    const repository = repositoryWithOneBooking();
    const useCase = new BookAppointment({
      bookingRepo: repository,
      scheduleRepo: new FakeScheduleRepo([schedule('b1'), schedule('b2')]),
      openingHours: opening,
      serviceDuration: 30,
      dailyLoadPolicy: { maxBookingsPerBarberPerDay: 1 },
    });
    const booking = await useCase.execute('', 'loc1', slot('10:15', '10:45'));
    expect(booking.barberId).toBe('b2');
  });

  it('rejects a specific barber who reached the daily load limit', async () => {
    const repository = repositoryWithOneBooking();
    const useCase = new BookAppointment({
      bookingRepo: repository,
      scheduleRepo: new FakeScheduleRepo([schedule('b1')]),
      openingHours: opening,
      serviceDuration: 30,
      dailyLoadPolicy: { maxBookingsPerBarberPerDay: 1 },
    });
    await expect(useCase.execute('b1', 'loc1', slot('10:15', '10:45'))).rejects.toBeInstanceOf(
      BookingConflictError
    );
  });
});
