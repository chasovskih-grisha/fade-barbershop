// OpeningHours — години роботи локації (MNG-ADM-03). 7 днів (Пн…Нд),
// кожен або вихідний (closed), або «відкриття < закриття». Value object,
// імутабельний.

export const WEEKLY_DAYS = 7;

export interface DayHours {
  /** 0=Пн … 6=Нд */
  dayOfWeek: number;
  /** "HH:MM" — null, якщо вихідний */
  open: string | null;
  close: string | null;
  /** вихідний день — часи ігноруються */
  closed: boolean;
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export class OpeningHours {
  constructor(private readonly data: readonly DayHours[]) {}

  static of(days: DayHours[]): OpeningHours {
    if (days.length !== WEEKLY_DAYS) {
      throw new Error('OpeningHours requires exactly 7 days');
    }
    const seen = new Set<number>();
    for (const day of days) validateDay(day, seen);
    return new OpeningHours([...days].sort((a, b) => a.dayOfWeek - b.dayOfWeek));
  }

  /** По днях, відсортовано Пн…Нд. Список імутабельний. */
  get days(): readonly DayHours[] {
    return this.data;
  }

  equals(other: OpeningHours): boolean {
    return JSON.stringify(this.data) === JSON.stringify(other.data);
  }
}

function validateDay(day: DayHours, seen: Set<number>): void {
  if (seen.has(day.dayOfWeek)) throw new Error('Duplicate dayOfWeek');
  if (day.dayOfWeek < 0 || day.dayOfWeek > 6) throw new Error('dayOfWeek out of range');
  seen.add(day.dayOfWeek);
  if (day.closed) return;
  if (!day.open || !day.close) throw new Error('Open and close required when not closed');
  if (!TIME_RE.test(day.open) || !TIME_RE.test(day.close)) {
    throw new Error('Times must be HH:MM');
  }
  if (day.open >= day.close) throw new Error('Open must be before close');
}
