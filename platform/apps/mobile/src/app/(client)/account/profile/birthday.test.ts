// T-4730c: день і місяць без року — днів у місяці (з урахуванням лютого)
// і показ «12 листопада». Рік у контролі відсутній.
import { clampDay, daysInMonth, formatBirthday } from './birthday';

describe('birthday — день і місяць без року (T-4730c)', () => {
  it('formatBirthday показує «12 листопада» без року', () => {
    expect(formatBirthday({ day: 12, month: 11 })).toBe('12 листопада');
  });

  it('порожнє значення — порожній рядок, а не вигадана дата', () => {
    expect(formatBirthday(null)).toBe('');
  });

  it('daysInMonth знає довжину місяців і лютий (29)', () => {
    expect(daysInMonth(2)).toBe(29);
    expect(daysInMonth(4)).toBe(30);
    expect(daysInMonth(12)).toBe(31);
  });

  it('clampDay зменшує неможливий день скороченого місяця', () => {
    expect(clampDay(31, 2)).toBe(29);
    expect(clampDay(31, 4)).toBe(30);
    expect(clampDay(15, 2)).toBe(15);
  });

  it('clampDay не чіпає невибраний день або місяць', () => {
    expect(clampDay(0, 2)).toBe(0);
    expect(clampDay(31, 0)).toBe(31);
  });
});
