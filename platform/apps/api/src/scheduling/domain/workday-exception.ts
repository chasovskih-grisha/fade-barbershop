// Особливі дні локації (T-4414): виняток перекриває тижневий графік на одну
// дату — локація зачинена (closed) або працює інші години. Пріоритет над
// регулярним графіком: вікно дня береться з винятку, а зачинена дата слотів
// не дає взагалі. Причина обов'язкова — календар має підпис.

import { toMinutes } from './time-utils';
import type { OpeningHours } from '../../locations/domain/opening-hours';

export interface WorkdayExceptionData {
  id: string;
  locationId: string;
  date: string; // 'YYYY-MM-DD'
  closed: boolean;
  open: string | null; // 'HH:MM' — потрібен, коли не closed
  close: string | null;
  reason: string;
  createdBy: string;
}

export interface DayWindow {
  start: number; // хвилини від півночі
  end: number;
}

export class InvalidWorkdayExceptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidWorkdayExceptionError';
  }

  static of(message: string): InvalidWorkdayExceptionError {
    return new InvalidWorkdayExceptionError(message);
  }
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function isRealDate(date: string): boolean {
  if (!DATE_RE.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

/** Створити виняток: дата реальна, причина обов'язкова, години валідні. */
export function createWorkdayException(data: WorkdayExceptionData): WorkdayExceptionData {
  if (!isRealDate(data.date)) throw InvalidWorkdayExceptionError.of('A valid date is required');
  if (!data.reason.trim()) throw InvalidWorkdayExceptionError.of('An exception needs a reason');
  if (data.closed) return { ...data, open: null, close: null };
  if (!data.open || !data.close || !TIME_RE.test(data.open) || !TIME_RE.test(data.close)) {
    throw InvalidWorkdayExceptionError.of('Open and close must be HH:MM');
  }
  if (toMinutes(data.open) >= toMinutes(data.close)) {
    throw InvalidWorkdayExceptionError.of('Open must be before close');
  }
  return { ...data };
}

function exceptionWindow(exception: WorkdayExceptionData): DayWindow | null {
  if (exception.closed || !exception.open || !exception.close) return null;
  return { start: toMinutes(exception.open), end: toMinutes(exception.close) };
}

function regularWindow(opening: OpeningHours, dayOfWeek: number): DayWindow | null {
  const day = opening.days.find((d) => d.dayOfWeek === dayOfWeek);
  if (!day || day.closed || !day.open || !day.close) return null;
  return { start: toMinutes(day.open), end: toMinutes(day.close) };
}

/** Вікно дня з урахуванням винятку: зачинена дата → null (слотів немає);
 *  власні години → вони; без винятку → тижневий графік локації. */
export function effectiveDayWindow(
  opening: OpeningHours,
  dayOfWeek: number,
  exception: WorkdayExceptionData | null
): DayWindow | null {
  return exception ? exceptionWindow(exception) : regularWindow(opening, dayOfWeek);
}

/** Перевірка накладання винятків: на одну дату в тій самій локації не може бути більше одного винятку. */
export function hasWorkdayExceptionOverlap(
  existing: WorkdayExceptionData[],
  candidate: WorkdayExceptionData
): boolean {
  return existing.some(
    (ex) => ex.locationId === candidate.locationId && ex.date === candidate.date && ex.id !== candidate.id
  );
}
