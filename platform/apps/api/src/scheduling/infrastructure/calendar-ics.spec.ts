import { buildIcs, escapeIcsText, formatIcsDate, type IcsBooking } from './calendar-ics';
import { kyivStamp } from '../application/kyiv-stamp';

const LOCATION = { name: 'FADE Сіті', address: 'вул. Хрещатик, 1' };

function booking(overrides: Partial<IcsBooking> = {}): IcsBooking {
  return {
    id: 'booking-1',
    start: new Date('2026-07-15T09:00:00Z'),
    end: new Date('2026-07-15T10:00:00Z'),
    barberId: 'barber-1',
    agreedPrice: 600,
    finalPrice: 600,
    appliedDiscounts: [],
    haircutReferenceId: null,
    status: 'booked',
    version: 0,
    ...overrides,
  };
}

const uidOf = (ics: string) => ics.split('\r\n').find((line) => line.startsWith('UID:')) ?? '';

describe('calendar ICS export (T-4446a)', () => {
  it('writes an absolute UTC instant, so a visit keeps its local time across DST', () => {
    // 12:00 Kyiv: улітку EEST (UTC+3) — 09:00Z, узимку EET (UTC+2) — 10:00Z.
    const summerStart = new Date('2026-07-15T09:00:00Z');
    const winterStart = new Date('2026-12-15T10:00:00Z');
    expect(kyivStamp(summerStart).time).toBe('12:00');
    expect(kyivStamp(winterStart).time).toBe('12:00');

    const summer = buildIcs(
      booking({ start: summerStart, end: new Date('2026-07-15T10:00:00Z') }),
      LOCATION
    );
    const winter = buildIcs(
      booking({ start: winterStart, end: new Date('2026-12-15T11:00:00Z') }),
      LOCATION
    );

    // Плаваючий час (`DTSTART:20260715T090000` без Z) показав би 09:00 у поясі
    // пристрою — тому Z обов'язковий.
    expect(summer).toContain('DTSTART:20260715T090000Z');
    expect(summer).toContain('DTEND:20260715T100000Z');
    expect(winter).toContain('DTSTART:20261215T100000Z');
    expect(winter).toContain('DTEND:20261215T110000Z');
  });

  it('keeps one event identity per visit, so a reschedule updates instead of duplicating', () => {
    const before = buildIcs(booking({ version: 2 }), LOCATION);
    const after = buildIcs(
      booking({
        version: 3,
        start: new Date('2026-07-15T11:00:00Z'),
        end: new Date('2026-07-15T12:00:00Z'),
      }),
      LOCATION
    );

    expect(uidOf(after)).toBe(uidOf(before));
    expect(uidOf(before)).toBe('UID:fade-booking-booking-1@fade.barber');
    expect(before).toContain('SEQUENCE:2');
    expect(after).toContain('SEQUENCE:3');
  });

  it('marks a cancelled visit as cancelled on the same event', () => {
    const ics = buildIcs(booking({ status: 'cancelled', version: 4 }), LOCATION);

    expect(ics).toContain('STATUS:CANCELLED');
    expect(ics).toContain('SEQUENCE:4');
    expect(ics).toContain('UID:fade-booking-booking-1@fade.barber');
    expect(buildIcs(booking(), LOCATION)).toContain('STATUS:CONFIRMED');
  });

  it('escapes separators so every field stays a single line', () => {
    const ics = buildIcs(booking(), {
      name: 'FADE, Сіті',
      address: 'вул. Хрещатик; 1\nповерх 2',
    });

    expect(ics).toContain('LOCATION:FADE\\, Сіті\\, вул. Хрещатик\\; 1\\nповерх 2');
    for (const line of ics.split('\r\n')) expect(line).not.toMatch(/[\r\n]/);
    expect(escapeIcsText('a\nb')).toBe('a\\nb');
  });

  it('formats dates as compact UTC stamps', () => {
    expect(formatIcsDate(new Date('2026-01-02T03:04:05.678Z'))).toBe('20260102T030405Z');
  });
});
