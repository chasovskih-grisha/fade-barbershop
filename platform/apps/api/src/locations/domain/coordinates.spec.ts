import { Coordinates } from './coordinates';

describe('Coordinates', () => {
  it('приймає валідні значення', () => {
    const c = Coordinates.of(50.4501, 30.5234);
    expect(c.lat).toBe(50.4501);
    expect(c.lng).toBe(30.5234);
  });

  it('відхиляє значення поза діапазоном', () => {
    expect(() => Coordinates.of(91, 0)).toThrow('lat');
    expect(() => Coordinates.of(0, 181)).toThrow('lng');
  });

  it('equals порівнює значення', () => {
    expect(Coordinates.of(1, 2).equals(Coordinates.of(1, 2))).toBe(true);
    expect(Coordinates.of(1, 2).equals(Coordinates.of(2, 1))).toBe(false);
  });
});
