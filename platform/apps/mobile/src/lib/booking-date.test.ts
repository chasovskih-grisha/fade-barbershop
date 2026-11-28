import { isBookableDate } from './booking-date';

describe('isBookableDate', () => {
  it('accepts today and future real dates', () => {
    expect(isBookableDate('2026-11-24', '2026-11-24')).toBe(true);
    expect(isBookableDate('2026-12-31', '2026-11-24')).toBe(true);
  });

  it('rejects malformed, impossible and past dates', () => {
    expect(isBookableDate('24.11.2026', '2026-11-24')).toBe(false);
    expect(isBookableDate('2026-02-30', '2026-11-24')).toBe(false);
    expect(isBookableDate('2026-11-23', '2026-11-24')).toBe(false);
  });
});
