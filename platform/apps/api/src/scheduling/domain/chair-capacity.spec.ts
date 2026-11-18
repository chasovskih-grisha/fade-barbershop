import { hasChairCapacity } from './chair-capacity';

const at = (minute: number) => new Date(Date.UTC(2026, 9, 5, 9, minute));

describe('hasChairCapacity', () => {
  it('allows adjacent half-open intervals and bookings ending at the requested start', () => {
    expect(
      hasChairCapacity({
        existing: [{ start: at(0), end: at(15) }],
        start: at(15),
        end: at(30),
        chairs: 1,
      })
    ).toBe(true);
  });

  it('rejects when existing bookings plus the request exceed capacity at any point', () => {
    const existing = [
      { start: at(0), end: at(30) },
      { start: at(15), end: at(45) },
    ];
    expect(hasChairCapacity({ existing, start: at(10), end: at(20), chairs: 2 })).toBe(false);
  });

  it('allows a request when staggered bookings never exceed the remaining chair capacity', () => {
    const existing = [
      { start: at(0), end: at(15) },
      { start: at(15), end: at(30) },
    ];
    expect(hasChairCapacity({ existing, start: at(0), end: at(30), chairs: 2 })).toBe(true);
  });
});
