import { Booking } from '../domain/booking';
import { BookingRepository } from '../domain/booking-repository';
import { BarberSchedule } from '../domain/availability';
import { BookAppointment } from './book-appointment.use-case';
import { FakeScheduleRepo, makeOpeningHours, slotOf } from './book-appointment.fakes';

const day = 0;
const date = '2026-10-05';
const opening = makeOpeningHours(day, '08:00', '20:00');
const schedule = (barberId: string) =>
  BarberSchedule.create({
    barberId,
    locationId: 'loc1',
    windows: [{ dayOfWeek: day, start: '09:00', end: '18:00' }],
  });
const slot = (start: string, end: string) => slotOf(start, end, date);

describe('BookAppointment service snapshot', () => {
  it('stores the selected service price and fulfillment snapshot', async () => {
    const saved: Booking[] = [];
    const repository: BookingRepository = {
      save: async (booking) => {
        saved.push(booking);
      },
      findOverlaps: async () => [],
      findAllOverlaps: async () => [],
      findForBarberAtLocation: async () => [],
      findBarberOverlaps: async () => [],
    };
    const useCase = new BookAppointment({
      bookingRepo: repository,
      scheduleRepo: new FakeScheduleRepo([schedule('b1')]),
      openingHours: opening,
      serviceDuration: 30,
      serviceSnapshot: { serviceId: 'cut', agreedPrice: 300, fulfillmentMode: 'sequential' },
    });
    await useCase.execute('', 'loc1', slot('13:00', '13:30'));
    expect(
      saved.map((booking) => [booking.serviceId, booking.agreedPrice, booking.fulfillmentMode])
    ).toEqual([['cut', 300, 'sequential']]);
  });
});
