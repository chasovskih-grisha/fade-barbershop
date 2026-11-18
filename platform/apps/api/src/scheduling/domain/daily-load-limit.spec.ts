import {
  NO_DAILY_LOAD_LIMIT,
  bookingsOnDay,
  dayKey,
  exceedsDailyLoad,
  type DatedBooking,
} from './daily-load-limit';

const barberA = '0190f1c2-0000-7000-8000-0000000000a1';
const barberB = '0190f1c2-0000-7000-8000-0000000000b2';

const booking = (barberId: string, iso: string): DatedBooking => ({
  barberId,
  start: new Date(iso),
});

describe('daily load limit (T-4421)', () => {
  it('a_null_limit_never_blocks_a_visit', () => {
    const bookings = [
      booking(barberA, '2026-11-10T09:00:00.000Z'),
      booking(barberA, '2026-11-10T10:00:00.000Z'),
    ];
    expect(
      exceedsDailyLoad({
        bookings,
        barberId: barberA,
        start: new Date('2026-11-10T11:00:00.000Z'),
        policy: NO_DAILY_LOAD_LIMIT,
      })
    ).toBe(false);
  });

  it('blocks_the_visit_that_would_exceed_the_daily_limit', () => {
    const bookings = [
      booking(barberA, '2026-11-10T09:00:00.000Z'),
      booking(barberA, '2026-11-10T10:00:00.000Z'),
    ];
    expect(
      exceedsDailyLoad({
        bookings,
        barberId: barberA,
        start: new Date('2026-11-10T11:00:00.000Z'),
        policy: { maxBookingsPerBarberPerDay: 2 },
      })
    ).toBe(true);
  });

  it('allows_a_visit_while_the_barber_is_below_the_limit', () => {
    const bookings = [booking(barberA, '2026-11-10T09:00:00.000Z')];
    expect(
      exceedsDailyLoad({
        bookings,
        barberId: barberA,
        start: new Date('2026-11-10T11:00:00.000Z'),
        policy: { maxBookingsPerBarberPerDay: 2 },
      })
    ).toBe(false);
  });

  it('counts_the_limit_per_calendar_day_not_per_barber_total', () => {
    const bookings = [
      booking(barberA, '2026-11-10T09:00:00.000Z'),
      booking(barberA, '2026-11-10T10:00:00.000Z'),
    ];
    expect(
      exceedsDailyLoad({
        bookings,
        barberId: barberA,
        start: new Date('2026-11-11T09:00:00.000Z'),
        policy: { maxBookingsPerBarberPerDay: 2 },
      })
    ).toBe(false);
  });

  it('keeps_a_limit_per_barber_independent', () => {
    const bookings = [booking(barberA, '2026-11-10T09:00:00.000Z')];
    expect(
      exceedsDailyLoad({
        bookings,
        barberId: barberB,
        start: new Date('2026-11-10T10:00:00.000Z'),
        policy: { maxBookingsPerBarberPerDay: 1 },
      })
    ).toBe(false);
  });

  it('ignores_an_invalid_limit_instead_of_blocking_booking', () => {
    expect(
      exceedsDailyLoad({
        bookings: [],
        barberId: barberA,
        start: new Date('2026-11-10T09:00:00.000Z'),
        policy: { maxBookingsPerBarberPerDay: 0 },
      })
    ).toBe(false);
  });

  it('counts_bookings_on_a_day_for_one_barber', () => {
    const bookings = [
      booking(barberA, '2026-11-10T09:00:00.000Z'),
      booking(barberA, '2026-11-10T23:30:00.000Z'),
      booking(barberB, '2026-11-10T09:00:00.000Z'),
    ];
    expect(bookingsOnDay(bookings, barberA, '2026-11-10')).toBe(2);
    expect(dayKey(new Date('2026-11-10T23:30:00.000Z'))).toBe('2026-11-10');
  });
});
