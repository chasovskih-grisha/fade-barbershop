import { BarberSchedule } from '../domain/availability';
import { BookAppointment } from './book-appointment.use-case';
import { FakeBookingRepository, FakeScheduleRepo, makeOpeningHours, slotOf } from './book-appointment.fakes';

describe('T-4618a Agreed Duration on Visit', () => {
  const opening = makeOpeningHours(0, '08:00', '20:00');
  const schedule = BarberSchedule.create({
    barberId: 'barber-1',
    locationId: 'loc-1',
    windows: [{ dayOfWeek: 0, start: '09:00', end: '18:00' }],
  });

  it('persists agreedDuration and derived end, and catalog change does not affect existing bookings', async () => {
    const repository = new FakeBookingRepository('plain');
    const useCase = new BookAppointment({
      bookingRepo: repository,
      scheduleRepo: new FakeScheduleRepo([schedule]),
      openingHours: opening,
      serviceDuration: 30,
      serviceSnapshot: { serviceId: 'svc-1', agreedPrice: 500, agreedDuration: 30, fulfillmentMode: 'sequential' },
    });

    const b1 = await useCase.execute('barber-1', 'loc-1', slotOf('10:00', '10:30'));
    expect(b1.agreedDuration).toBe(30);
    expect(b1.end.getTime() - b1.start.getTime()).toBe(30 * 60000);

    const b2 = await useCase.execute('barber-1', 'loc-1', slotOf('10:30', '11:00'));
    expect(b2.agreedDuration).toBe(30);
    expect(b2.start.getTime()).toBe(b1.end.getTime());
    expect(repository.bookings.length).toBe(2);
  });

  it('lengthening the catalog does not move the end of an existing visit', async () => {
    const repository = new FakeBookingRepository('chairs');
    const book = (duration: number) =>
      new BookAppointment({
        bookingRepo: repository,
        scheduleRepo: new FakeScheduleRepo([schedule]),
        openingHours: opening,
        serviceDuration: duration,
        serviceSnapshot: {
          serviceId: 'svc-1',
          agreedPrice: 500,
          agreedDuration: duration,
          fulfillmentMode: 'sequential',
        },
      });

    const first = await book(30).execute('barber-1', 'loc-1', slotOf('10:00', '10:30'));
    // Каталог подовжили 30 → 45: наступний запис — 45 хв, але старі візити
    // тримають свій `end`, тож він стартує одразу після першого.
    const second = await book(45).execute('barber-1', 'loc-1', slotOf('10:30', '11:15'));

    expect(first.agreedDuration).toBe(30);
    expect(first.end.getTime() - first.start.getTime()).toBe(30 * 60000);
    expect(second.agreedDuration).toBe(45);
    expect(second.start.getTime()).toBe(first.end.getTime());
    expect(repository.bookings.map((b) => b.end.getTime())).toEqual([
      new Date('2026-10-05T10:30:00.000Z').getTime(),
      new Date('2026-10-05T11:15:00.000Z').getTime(),
    ]);
  });
});
