// T-4811: surge множить базову ціну до знижок і фіксується у снепшоті запису.
import { priceSnapshot } from './book-appointment.pricing';
import type { BookAppointmentDeps } from './book-appointment.types';

const START = new Date('2026-11-20T18:30:00Z');

function deps(patch: Partial<BookAppointmentDeps> = {}): BookAppointmentDeps {
  return {
    bookingRepo: {} as BookAppointmentDeps['bookingRepo'],
    scheduleRepo: {} as BookAppointmentDeps['scheduleRepo'],
    openingHours: {} as BookAppointmentDeps['openingHours'],
    serviceDuration: 60,
    serviceSnapshot: { serviceId: 'svc-1', agreedPrice: 20_000 },
    ...patch,
  };
}

describe('priceSnapshot with surge (T-4811)', () => {
  it('без порту surge ціна не змінюється', async () => {
    const snapshot = await priceSnapshot(deps(), START, 'loc-1');
    expect(snapshot).toEqual({ agreedPrice: 20_000, appliedDiscounts: [], finalPrice: 20_000 });
  });

  it('surge множить базову ціну і зберігає множник та правило', async () => {
    const surge = {
      quote: async () => ({ price: 25_000, multiplierBp: 12_500, ruleId: 'surge-1' }),
    };
    const snapshot = await priceSnapshot(deps({ surge }), START, 'loc-1');
    expect(snapshot).toMatchObject({
      agreedPrice: 25_000,
      finalPrice: 25_000,
      surgeBasisPoints: 12_500,
      surgeRuleId: 'surge-1',
    });
  });

  it('знижка рахується від surge-ціни, а не від базової', async () => {
    const surge = {
      quote: async () => ({ price: 25_000, multiplierBp: 12_500, ruleId: 'surge-1' }),
    };
    // prettier-ignore
    const snapshot = await priceSnapshot(deps({ surge, discounts: { discounts: [{ type: 'promo_code', sourceId: 'PROMO10', amount: 2_500 }] } as unknown as BookAppointmentDeps['discounts'] }), START, 'loc-1');
    expect(snapshot.agreedPrice).toBe(25_000);
    expect(snapshot.finalPrice).toBe(22_500);
  });

  it('множник 10000 (без надбавки) у снепшот не пишеться', async () => {
    const surge = { quote: async () => ({ price: 20_000, multiplierBp: 10_000, ruleId: null }) };
    const snapshot = await priceSnapshot(deps({ surge }), START, 'loc-1');
    expect(snapshot.surgeBasisPoints).toBeUndefined();
    expect(snapshot.surgeRuleId).toBeUndefined();
  });
});
