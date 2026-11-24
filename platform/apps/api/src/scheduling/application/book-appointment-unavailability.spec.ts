// T-4616a: недоступність барбера блокує новий запис у її інтервалі; інший
// барбер локації працює як звичайно.
import { BarberSchedule } from '../domain/availability';
import { InvalidSlotError } from '../domain/slot-validator';
import { BookAppointment } from './book-appointment.use-case';
import {
  FakeBookingRepository,
  FakeScheduleRepo,
  makeOpeningHours,
  slotOf,
} from './book-appointment.fakes';
import { expectRejected } from '@fade/test-utils';

const opening = makeOpeningHours(0, '08:00', '20:00');
const slot = slotOf('09:30', '10:00');

const scheduleFor = (barberId: string) =>
  BarberSchedule.create({
    barberId,
    locationId: 'loc1',
    windows: [{ dayOfWeek: 0, start: '09:00', end: '12:00' }],
  });

const unavailable = (ids: string[]) => ({
  covers: async (input: { barberId: string }) => ids.includes(input.barberId),
});

describe('BookAppointment + T-4616a unavailability', () => {
  it('rejects an explicit booking for the unavailable barber', async () => {
    const useCase = new BookAppointment({
      bookingRepo: new FakeBookingRepository(),
      scheduleRepo: new FakeScheduleRepo([scheduleFor('b1')]),
      openingHours: opening,
      serviceDuration: 30,
      unavailable: unavailable(['b1']),
    });

    await expectRejected(
      useCase.execute('b1', 'loc1', slot),
      InvalidSlotError,
      'b1 позначений недоступним на цей слот'
    );
  });

  it('any-barber booking skips the unavailable barber and books another one', async () => {
    const useCase = new BookAppointment({
      bookingRepo: new FakeBookingRepository(),
      scheduleRepo: new FakeScheduleRepo([scheduleFor('b1'), scheduleFor('b2')]),
      openingHours: opening,
      serviceDuration: 30,
      unavailable: unavailable(['b1']),
    });

    const booking = await useCase.execute('', 'loc1', slot);

    expect(booking.barberId).toBe('b2');
  });
});
