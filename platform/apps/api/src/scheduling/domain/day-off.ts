// Одноразові вихідні барбера (T-230, SCH-002): конкретна дата або діапазон
// (відпустка, лікарняний) поверх тижневого шаблону графіка. Вікно тижневого
// шаблону не застосовується на день, що накридений вихідним. Домен без Nest/Prisma.

import { dayOfWeekFor } from './day-of-week';

export interface DayOffData {
  id: string;
  barberId: string;
  from: string; // 'YYYY-MM-DD'
  to: string; // 'YYYY-MM-DD'
  reason: string;
}

export interface DayOffRepository {
  findByBarberId(barberId: string): Promise<DayOffData[]>;
}

export class InvalidDayOffError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDayOffError';
  }
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(date: string): boolean {
  if (!DATE_RE.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

/** Створити вихідний: реальні дати, `from <= to`, причина обов'язкова. */
export function createDayOff(data: DayOffData): DayOffData {
  if (!isRealDate(data.from) || !isRealDate(data.to)) {
    throw new InvalidDayOffError('A valid date range is required');
  }
  if (data.from > data.to) throw new InvalidDayOffError('from must not be after to');
  if (!data.reason.trim()) throw new InvalidDayOffError('A day off needs a reason');
  return { ...data };
}

/** Дата накридена вихідним (включно з межами діапазону). */
export function isDayOff(dayOffs: DayOffData[], date: string): boolean {
  return dayOffs.some((dayOff) => date >= dayOff.from && date <= dayOff.to);
}

/** Вікна, що лишаються чинними на дату: вихідний прибирає всі вікна того дня. */
export function windowsForDate<T extends { dayOfWeek: number }>(
  windows: T[],
  dayOffs: DayOffData[],
  date: string
): T[] {
  if (isDayOff(dayOffs, date)) return [];
  const day = dayOfWeekFor(date);
  return windows.filter((window) => window.dayOfWeek === day);
}

/** Порт читання вихідних барбера (T-4447); адаптер живе в інфраструктурі. */
export interface DayOffRepository {
  findByBarberId(barberId: string): Promise<DayOffData[]>;
}
