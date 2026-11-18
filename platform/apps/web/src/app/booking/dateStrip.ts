// Стрічка дат флоу запису (T-041, екран 3): 14 днів від сьогодні,
// короткі підписи днів тижня, Monday-first індекс для API.
export interface DayOption {
  date: string;
  label: string;
  isMondayFirst: number;
}

const WEEKDAYS = ['нед', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

export const isoDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const todayIso = (): string => isoDate(new Date());

/** Стрічка 14 днів від сьогодні (екран 3, booking-flow.md). */
export function buildDays(): DayOption[] {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    // prettier-ignore
    return { date: isoDate(d), label: WEEKDAYS[d.getDay()] ?? '', isMondayFirst: (d.getDay() + 6) % 7 };
  });
}
