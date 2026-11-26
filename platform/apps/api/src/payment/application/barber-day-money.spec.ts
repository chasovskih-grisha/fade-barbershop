import { PaymentForm, PaymentStatus } from '../../billing/domain/payment-status.enum';
import {
  BarberDayMoney,
  kyivDayRange,
  type BarberDayVisit,
} from './barber-day-money.use-case';

function visit(overrides: Partial<BarberDayVisit> = {}): BarberDayVisit {
  return {
    bookingId: 'bk-1',
    status: 'completed',
    finalPrice: 500,
    payments: [],
    ...overrides,
  };
}

function money(visits: BarberDayVisit[]) {
  return new BarberDayMoney({ visits: { visitsFor: async () => visits } });
}

describe('BarberDayMoney (T-4404)', () => {
  it('рахує прийняте за формами і скільки лишилось винним', async () => {
    const summary = await money([
      visit({
        payments: [
          { amount: 300, form: PaymentForm.CASH, status: PaymentStatus.PAID },
          { amount: 150, form: PaymentForm.CARD, status: PaymentStatus.DEPOSIT_PAID },
        ],
      }),
    ]).execute('barber-1', '2026-11-26');

    expect(summary).toMatchObject({
      visits: 1,
      completed: 1,
      expected: 500,
      collected: 450,
      outstanding: 50,
      byForm: { cash: 300, pos: 0, card: 150, certificate: 0 },
    });
  });

  it('не рахує відхилений платіж як гроші', async () => {
    const summary = await money([
      visit({ payments: [{ amount: 300, form: PaymentForm.CASH, status: PaymentStatus.CANCELLED }] }),
    ]).execute('barber-1', '2026-11-26');

    expect(summary?.collected).toBe(0);
    expect(summary?.outstanding).toBe(500);
  });

  it('незавершений візит не формує «мало бути», але його гроші видно', async () => {
    const summary = await money([
      visit({
        status: 'confirmed',
        payments: [{ amount: 210, form: PaymentForm.CARD, status: PaymentStatus.DEPOSIT_PAID }],
      }),
    ]).execute('barber-1', '2026-11-26');

    expect(summary).toMatchObject({ visits: 1, completed: 0, expected: 0, collected: 210 });
  });

  it('порожній день — нулі, а не відсутня відповідь', async () => {
    const summary = await money([]).execute('barber-1', '2026-11-26');

    expect(summary).toMatchObject({ visits: 0, expected: 0, collected: 0, outstanding: 0 });
  });

  it('відмовляє на дату не у форматі YYYY-MM-DD', async () => {
    await expect(money([]).execute('barber-1', '26.11.2026')).resolves.toBeNull();
  });

  it('межі київської доби не зсуваються літнім часом', () => {
    expect(kyivDayRange('2026-07-01')?.from.toISOString()).toBe('2026-06-30T21:00:00.000Z');
    expect(kyivDayRange('2026-01-15')?.from.toISOString()).toBe('2026-01-14T22:00:00.000Z');
  });
});
