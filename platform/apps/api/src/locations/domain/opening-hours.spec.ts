import { OpeningHours } from './opening-hours';
import { weekDays } from '../test-helpers.fakes';

describe('OpeningHours', () => {
  it('сортує дні і зберігає 7 днів', () => {
    const hours = OpeningHours.of([...weekDays()].reverse());
    expect(hours.days.map((d) => d.dayOfWeek)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('вимагає рівно 7 днів', () => {
    expect(() => OpeningHours.of(weekDays().slice(0, 6))).toThrow('7 days');
  });

  it('відхиляє дублікати днів', () => {
    const days = weekDays().map((d, i) => (i === 6 ? { ...d, dayOfWeek: 0 } : d));
    expect(() => OpeningHours.of(days)).toThrow('Duplicate dayOfWeek');
  });

  it('відхиляє день поза діапазоном', () => {
    const days = weekDays().map((d, i) => (i === 6 ? { ...d, dayOfWeek: 7 } : d));
    expect(() => OpeningHours.of(days)).toThrow('out of range');
  });

  it('вимагає часи для відкритого дня', () => {
    const days = weekDays().map((d) => (d.dayOfWeek === 0 ? { ...d, open: null } : d));
    expect(() => OpeningHours.of(days)).toThrow('Open and close required');
  });

  it('відхиляє некоректний формат часу', () => {
    const days = weekDays({ 0: { open: '9:00', close: '20:00' } });
    expect(() => OpeningHours.of(days)).toThrow('HH:MM');
  });

  it('вимагає open < close', () => {
    const days = weekDays({ 0: { open: '20:00', close: '09:00' } });
    expect(() => OpeningHours.of(days)).toThrow('before close');
  });

  it('equals порівнює значення', () => {
    expect(OpeningHours.of(weekDays()).equals(OpeningHours.of(weekDays()))).toBe(true);
    expect(
      OpeningHours.of(weekDays()).equals(
        OpeningHours.of(weekDays({ 0: { open: '10:00', close: '18:00' } }))
      )
    ).toBe(false);
  });
});
