// T-4619a: публічні слоти поважають активне депозитне утримання й звільняють
// крісло, щойно вікно минуло — навіть якщо sweeper ще не пройшов.
import { Booking } from '../../scheduling/domain/booking';
import { makeSlots, SLOT_REQUEST } from './available-slots.fakes';

// prettier-ignore
const heldBooking = Booking.create({ barberId: 'b1', locationId: 'loc-1', start: new Date('2026-10-05T09:00:00.000Z'), end: new Date('2026-10-05T10:00:00.000Z') });

describe('AvailableSlots deposit holds (T-4619a)', () => {
  it('keeps an unpaid chair blocked while the hold is active', async () => {
    const slots = await makeSlots({ bookings: [heldBooking], released: [] }).handle(SLOT_REQUEST);

    expect(slots.find((s) => s.start === '09:15')?.barbers).toEqual(['b2']);
    expect(slots.find((s) => s.start === '10:00')?.barbers).toContain('b1');
  });

  it('frees the chair once the hold has expired', async () => {
    const slots = await makeSlots({ bookings: [heldBooking], released: [heldBooking.id] }).handle(
      SLOT_REQUEST
    );

    expect(slots.find((s) => s.start === '09:15')?.barbers).toContain('b1');
  });
});
