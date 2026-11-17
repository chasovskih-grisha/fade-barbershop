// Домен: чинність дня й місяця народження (T-4730). Рік не питаємо, тому
// лютий завжди дозволяє 29 (високосний рік існує).
import { isValidBirthday } from './birthday';

describe('isValidBirthday (T-4730)', () => {
  it('приймає реальний день і місяць', () => {
    expect(isValidBirthday({ day: 12, month: 11 })).toBe(true);
    expect(isValidBirthday({ day: 29, month: 2 })).toBe(true);
  });

  it('відхиляє неможливий день для місяця', () => {
    expect(isValidBirthday({ day: 31, month: 2 })).toBe(false);
    expect(isValidBirthday({ day: 31, month: 4 })).toBe(false);
  });

  it('відхиляє місяць поза 1–12 і день поза 1–31', () => {
    expect(isValidBirthday({ day: 1, month: 0 })).toBe(false);
    expect(isValidBirthday({ day: 1, month: 13 })).toBe(false);
    expect(isValidBirthday({ day: 0, month: 5 })).toBe(false);
  });
});
