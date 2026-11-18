// T-4536: канонічний набір каналів запису, аліаси й фільтр адмін-списку.
import { BOOKING_SOURCES, bookingSourceFilter, isKnownBookingSource, normalizeBookingSource } from './booking-source';

describe('booking sources (T-4536)', () => {
  it('містить усі канали зі специфікації', () => {
    expect(BOOKING_SOURCES).toHaveLength(10);
    expect(BOOKING_SOURCES).toEqual(
      expect.arrayContaining([
        'admin_phone',
        'walk_in',
        'barber_mobile',
        'client_web',
        'client_mobile',
        'quick_booking',
        'gbp',
        'external_integration',
        'waitlist_auto',
        'recurring',
      ])
    );
  });

  it('нормалізує історичні значення з БД', () => {
    expect(normalizeBookingSource('web')).toBe('client_web');
    expect(normalizeBookingSource('mobile')).toBe('client_mobile');
    expect(normalizeBookingSource('admin')).toBe('admin_phone');
    expect(normalizeBookingSource('walk_in')).toBe('walk_in');
    expect(normalizeBookingSource('gbp')).toBe('gbp');
  });

  it('невідомий канал не вважається валідним', () => {
    expect(normalizeBookingSource('telepathy')).toBeNull();
    expect(isKnownBookingSource('telepathy')).toBe(false);
    expect(isKnownBookingSource('quick_booking')).toBe(true);
  });

  it('фільтр розширює канонічний канал його аліасом', () => {
    expect(bookingSourceFilter('client_web').sort()).toEqual(['client_web', 'web']);
    expect(bookingSourceFilter('admin_phone,walk_in').sort()).toEqual([
      'admin',
      'admin_phone',
      'walk_in',
    ]);
  });

  it('фільтр ігнорує порожні й невідомі токени', () => {
    expect(bookingSourceFilter(' , telepathy, gbp ')).toEqual(['gbp']);
    expect(bookingSourceFilter('')).toEqual([]);
  });
});
