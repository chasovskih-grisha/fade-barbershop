import type { OpeningHour } from '@/lib/api/locations';

// T-4820: «сьогодні» на картці — це рядок із записаних `hours` локації, а не
// загальна обіцянка мережі. Доменний індекс дня той самий, що в LocationHours:
// 0 = понеділок … 6 = неділя (opening-hours.ts), тому Date.getDay() (0 = неділя)
// переводиться зсувом. Поки зона студії не зберігається, «сьогодні» — день
// пристрою, як і в годиннику детальної сторінки.

/** Доменний індекс дня (0 = понеділок … 6 = неділя) для будь-якого моменту. */
export const domainDayIndex = (now: Date = new Date()): number => (now.getDay() + 6) % 7;

/**
 * Години на сьогодні: `null` — рядок не рендериться (годин немає або дня немає
 * в розкладі), «Вихідний» — записаний вихідний, інакше «10:00–20:00».
 */
export function todayHours(hours: OpeningHour[], now: Date = new Date()): string | null {
  if (hours.length === 0) return null;
  const today = hours.find((day) => day.dayOfWeek === domainDayIndex(now));
  if (!today) return null;
  if (today.closed || !today.open || !today.close) return 'Вихідний';
  return `${today.open}–${today.close}`;
}
