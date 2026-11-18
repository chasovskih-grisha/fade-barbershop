import { defaultChairs, normalizeCode, normalizeRequired, optionalTrimmed, optionalValue } from './location.helpers';

describe('location.helpers', () => {
  it('defaultChairs повертає 2 активні крісла', () => {
    const chairs = defaultChairs();
    expect(chairs.map((c) => c.number)).toEqual([1, 2]);
    expect(chairs.every((c) => c.active)).toBe(true);
  });

  it('normalizeRequired тримить і відхиляє порожнє', () => {
    expect(normalizeRequired('  Fade Podil ', 'Name')).toBe('Fade Podil');
    expect(() => normalizeRequired('   ', 'Name')).toThrow('Name must not be empty');
  });

  it('normalizeCode тримить, upper-case, відхиляє порожнє', () => {
    expect(normalizeCode(' clt-01 ')).toBe('CLT-01');
    expect(() => normalizeCode('  ')).toThrow('Code must not be empty');
  });

  it('optionalTrimmed: undefined чи порожнє лишає поточне', () => {
    expect(optionalTrimmed(undefined, 'nowy')).toBe('nowy');
    expect(optionalTrimmed('   ', 'nowy')).toBe('nowy');
    expect(optionalTrimmed(' new', 'nowy')).toBe('new');
  });

  it('optionalValue: undefined лишає поточне', () => {
    expect(optionalValue(undefined, 7)).toBe(7);
    expect(optionalValue(3, 7)).toBe(3);
  });
});
