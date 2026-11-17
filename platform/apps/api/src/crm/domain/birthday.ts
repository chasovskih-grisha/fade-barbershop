// День народження без року (T-4730): правило чинності дня й місяця.
// Рік не питаємо, тому лютий дозволяє 29 (високосний рік завжди існує).
import type { Birthday } from './client-profile.types';

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** true — день і місяць утворюють реальну календарну дату. */
export function isValidBirthday(birthday: Birthday): boolean {
  const { day, month } = birthday;
  if (!Number.isInteger(day) || !Number.isInteger(month)) return false;
  if (month < 1 || month > 12) return false;
  const limit = DAYS_IN_MONTH[month - 1];
  return limit !== undefined && day >= 1 && day <= limit;
}

/** Неможливий день і місяць (напр. 31 лютого) — відмова збереження. */
export class InvalidBirthdayError extends Error {
  constructor(birthday: Birthday) {
    super(`Invalid birthday: ${birthday.day}/${birthday.month}`);
    this.name = 'InvalidBirthdayError';
  }
}
