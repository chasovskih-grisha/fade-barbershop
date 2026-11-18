// Any-barber вибір барбера (T-041): порожній barberId → перший вільний.
// Конфлікти збереження: конфлікт одного барбера не роняє запис — беремо
// наступного; конфлікт усіх + повні крісла від інших — BookingConflictError.
import { Booking, BookingConflictError } from '../domain/booking';
import { BarberSchedule } from '../domain/availability';
import { BookAppointment } from './book-appointment.use-case';
import { FakeBookingRepository, FakeScheduleRepo, makeOpeningHours, slotOf } from './book-appointment.fakes';
import { expectRejected } from '@fade/test-utils';

const opening = makeOpeningHours(0, '08:00', '20:00');
const SUNDAY_SLOT = slotOf('09:15', '09:45');

const scheduleFor = (barberId: string) =>
  BarberSchedule.create({
    barberId,
    locationId: 'loc1',
    windows: [{ dayOfWeek: 0, start: '09:00', end: '12:00' }],
  });

const bookedAt = (barberId: string) =>
  Booking.create({
    barberId,
    locationId: 'loc1',
    start: new Date('2026-10-05T09:00:00Z'),
    end: new Date('2026-10-05T12:00:00Z'),
  });

/** Use case з «конфліктним» репозиторієм і заданими існуючими записами. */
const setup = (existing: Booking[], barbers: string[]) => {
  const repository = new FakeBookingRepository('conflict');
  repository.bookings.push(...existing);
  const useCase = new BookAppointment({
    bookingRepo: repository,
    scheduleRepo: new FakeScheduleRepo(barbers.map(scheduleFor)),
    openingHours: opening,
    serviceDuration: 30,
  });
  return { useCase, repository };
};

describe('BookAppointment any-barber: конфлікт збереження одного барбера', () => {
  it('конфлікт у b1 не роняє запис: слот отримує b2', async () => {
    const { useCase } = setup([bookedAt('b1')], ['b1', 'b2']);

    const booking = await useCase.execute('', 'loc1', SUNDAY_SLOT);

    expect(booking.barberId).toBe('b2');
  });
});

describe('BookAppointment any-barber: конфлікт збереження всіх барберів', () => {
  it('усі кандидати в конфлікті → BookingConflictError', async () => {
    const { useCase } = setup([bookedAt('b1'), bookedAt('b2')], ['b1', 'b2']);

    await expectRejected(
      useCase.execute('', 'loc1', SUNDAY_SLOT),
      BookingConflictError,
      'усі барбери мають перетин із 09:00–12:00, а fake-репозиторій кидає conflict на save'
    );
  });

  it('крісла зайняті чужими барберами (x1, x2) → той самий conflict, хоча b1/b2 вільні', async () => {
    // Клієнтський контракт: повні крісла — теж BookingConflictError, і any-barber
    // не «проскакує» поверх чужих записів (запис лімітує локація, не барбер).
    const { useCase } = setup([bookedAt('x1'), bookedAt('x2')], ['b1', 'b2']);

    await expectRejected(
      useCase.execute('', 'loc1', SUNDAY_SLOT),
      BookingConflictError,
      '2 чужі записи на 09:00–12:00 вичерпують 2 крісла локації'
    );
  });
});
