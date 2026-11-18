import { overloadedBarbers, type DatedBooking } from './daily-load-limit';

const barberA = '0190f1c2-0000-7000-8000-0000000000a1';
const barberB = '0190f1c2-0000-7000-8000-0000000000b2';

const booking = (barberId: string, iso: string): DatedBooking => ({
  barberId,
  start: new Date(iso),
});

describe('overloaded barbers report (T-4421)', () => {
  it('reports_barbers_at_or_over_the_daily_limit', () => {
    const bookings = [
      booking(barberA, '2026-11-10T09:00:00.000Z'),
      booking(barberA, '2026-11-10T10:00:00.000Z'),
      booking(barberA, '2026-11-10T11:00:00.000Z'),
      booking(barberB, '2026-11-10T09:00:00.000Z'),
    ];
    expect(overloadedBarbers(bookings, { maxBookingsPerBarberPerDay: 2 })).toEqual([
      { barberId: barberA, day: '2026-11-10', count: 3 },
    ]);
  });

  it('returns_nothing_when_no_limit_is_configured', () => {
    const bookings = [booking(barberA, '2026-11-10T09:00:00.000Z')];
    expect(overloadedBarbers(bookings, { maxBookingsPerBarberPerDay: null })).toEqual([]);
  });

  it('separates_overload_by_day_and_barber', () => {
    const bookings = [
      booking(barberA, '2026-11-10T09:00:00.000Z'),
      booking(barberA, '2026-11-10T10:00:00.000Z'),
      booking(barberA, '2026-11-11T09:00:00.000Z'),
    ];
    expect(overloadedBarbers(bookings, { maxBookingsPerBarberPerDay: 2 })).toEqual([
      { barberId: barberA, day: '2026-11-10', count: 2 },
    ]);
  });
});
