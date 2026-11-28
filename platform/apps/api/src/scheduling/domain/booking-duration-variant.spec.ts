import { Booking } from './booking';

// T-4419 S2: запис тримає обраний варіант тривалості як частину снепшоту;
// без вибору поле лишається null — старі записи читаються як раніше.

const base = {
  barberId: 'barber-1',
  locationId: 'location-1',
  serviceId: 'service-1',
  start: new Date('2026-11-27T10:00:00Z'),
  end: new Date('2026-11-27T11:00:00Z'),
};

describe('Booking duration variant snapshot (T-4419 S2)', () => {
  it('keeps the selected variant and the variant length on the booking', () => {
    const booking = Booking.create({
      ...base,
      agreedDuration: 60,
      agreedPrice: 750,
      durationVariant: 'long',
    });

    expect(booking.durationVariant).toBe('long');
    expect(booking.agreedDuration).toBe(60);
    expect(booking.agreedPrice).toBe(750);
  });

  it('reads a booking without a variant as before', () => {
    const booking = Booking.create({ ...base, agreedDuration: 45, agreedPrice: 600 });
    expect(booking.durationVariant).toBeNull();
    expect(booking.agreedDuration).toBe(45);
  });
});
