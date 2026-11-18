// T-4802: чисти правила лока — ключ, backoff, перевірка володіння.
import { ReservationInvalidError, assertReservationHeld, backoffMs, isReservationExpired, slotLockKey, type SlotReservation } from './slot-reservation';

const START = new Date('2026-11-20T12:00:00Z');
const RESERVATION: SlotReservation = {
  key: 'k',
  token: 'token-1',
  expiresAt: new Date('2026-11-20T10:01:00Z'),
};

describe('slot-reservation rules (T-4802)', () => {
  it('ключ включає локацію, барбера і час початку', () => {
    expect(slotLockKey({ locationId: 'loc-1', barberId: 'barber-1', start: START })).toBe(
      'lock:slot:loc-1:barber-1:2026-11-20T12:00:00.000Z'
    );
  });

  it('«будь-який барбер» серіалізується під спільним ключем any', () => {
    expect(slotLockKey({ locationId: 'loc-1', barberId: '  ', start: START })).toBe(
      'lock:slot:loc-1:any:2026-11-20T12:00:00.000Z'
    );
  });

  it('backoff зростає експоненційно від 25 мс', () => {
    expect([0, 1, 2, 3].map(backoffMs)).toEqual([25, 50, 100, 200]);
  });

  it('резервація прострочена, коли TTL вичерпано (межа включно)', () => {
    expect(isReservationExpired(RESERVATION, new Date('2026-11-20T10:00:59Z'))).toBe(false);
    expect(isReservationExpired(RESERVATION, RESERVATION.expiresAt)).toBe(true);
  });

  it('перевірка володіння відхиляє чужий токен і прострочений лок', () => {
    const now = new Date('2026-11-20T10:00:30Z');
    expect(() => assertReservationHeld(RESERVATION, 'token-1', now)).not.toThrow();
    expect(() => assertReservationHeld(RESERVATION, 'other', now)).toThrow(ReservationInvalidError);
    expect(() => assertReservationHeld(RESERVATION, 'token-1', RESERVATION.expiresAt)).toThrow(
      'expired'
    );
  });
});
