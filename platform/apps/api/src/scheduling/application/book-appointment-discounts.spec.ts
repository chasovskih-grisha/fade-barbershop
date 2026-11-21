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

function harness(discounts?: {
  vip?: { type: 'vip'; sourceId: string; percent?: number; amount?: number };
  promoCode?: { type: 'promo_code'; sourceId: string; percent?: number; amount?: number };
}) {
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
    serviceSnapshot: { serviceId: 'cut', agreedPrice: 40000 },
    ...(discounts ? { discounts } : {}),
  });
  return { useCase, saved };
}

describe('BookAppointment price snapshot (T-090)', () => {
  it('snapshots final price equal to agreed price when there are no discounts', async () => {
    const { useCase, saved } = harness();
    await useCase.execute('', 'loc1', slot('13:00', '13:30'));
    expect(saved?.[0]?.agreedPrice).toBe(40000);
    expect(saved?.[0]?.finalPrice).toBe(40000);
    expect(saved?.[0]?.appliedDiscounts).toEqual([]);
  });

  it('applies a promo code and snapshots the discounted final price', async () => {
    const { useCase, saved } = harness({
      promoCode: { type: 'promo_code', sourceId: 'IG10', percent: 10 },
    });
    await useCase.execute('', 'loc1', slot('13:00', '13:30'));
    expect(saved?.[0]?.finalPrice).toBe(36000);
    expect(saved?.[0]?.appliedDiscounts).toEqual([
      { type: 'promo_code', sourceId: 'IG10', amount: 4000 },
    ]);
  });

  it('never lets discounts push the final price below zero (DSC-004)', async () => {
    const { useCase, saved } = harness({
      promoCode: { type: 'promo_code', sourceId: 'BIG', amount: 999999 },
    });
    await useCase.execute('', 'loc1', slot('13:00', '13:30'));
    expect(saved?.[0]?.finalPrice).toBe(0);
    expect(saved?.[0]?.appliedDiscounts).toEqual([
      { type: 'promo_code', sourceId: 'BIG', amount: 40000 },
    ]);
  });

  it('leaves price fields undefined when there is no service snapshot', async () => {
    const saved: Booking[] = [];
    const useCase = new BookAppointment({
      bookingRepo: {
        save: async (booking) => {
          saved.push(booking);
        },
        findOverlaps: async () => [],
        findAllOverlaps: async () => [],
        findForBarberAtLocation: async () => [],
        findBarberOverlaps: async () => [],
      },
      scheduleRepo: new FakeScheduleRepo([schedule('b1')]),
      openingHours: opening,
      serviceDuration: 30,
    });
    await useCase.execute('', 'loc1', slot('13:00', '13:30'));
    expect(saved?.[0]?.agreedPrice).toBeNull();
    expect(saved?.[0]?.finalPrice).toBeNull();
    expect(saved?.[0]?.appliedDiscounts).toBeNull();
  });
});
