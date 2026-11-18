import { clampDay, daysInMonth, formatBirthday } from '../birthday';

describe('birthday (T-4730b)', () => {
  it('показує день і місяць без року', () => {
    expect(formatBirthday({ day: 12, month: 11 })).toBe('12 листопада');
    expect(formatBirthday({ day: 1, month: 1 })).toBe('1 січня');
  });

  it('порожнє значення не вигадує дату', () => {
    expect(formatBirthday(null)).toBe('');
  });

  it('лютий дозволяє 29 днів, квітень — 30', () => {
    expect(daysInMonth(2)).toBe(29);
    expect(daysInMonth(4)).toBe(30);
    expect(daysInMonth(1)).toBe(31);
  });

  it('скорочений місяць зменшує неможливий день', () => {
    expect(clampDay(31, 2)).toBe(29);
    expect(clampDay(31, 4)).toBe(30);
    expect(clampDay(15, 2)).toBe(15);
  });

  it('не вибраний день або місяць лишається без змін', () => {
    expect(clampDay(0, 2)).toBe(0);
    expect(clampDay(31, 0)).toBe(31);
  });
});
