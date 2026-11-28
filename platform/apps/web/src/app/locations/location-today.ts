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

/** Хвилини доби з «HH:MM»; нечитабельний час — null, щоб не вигадувати стан. */
const minutesOfDay = (time: string): number | null => {
  const [hours, minutes] = time.split(':');
  return hours && minutes ? Number(hours) * 60 + Number(minutes) : null;
};

/**
 * Чи працює студія в момент `now` — лише коли запис має сьогоднішній інтервал.
 * `null` — годин на сьогодні немає (дня немає в розкладі, вихідний, час не
 * читається): картка тоді не додає стану, якого запис не знає.
 */
export function openNow(hours: OpeningHour[], now: Date = new Date()): boolean | null {
  const today = hours.find((day) => day.dayOfWeek === domainDayIndex(now));
  if (!today || today.closed || !today.open || !today.close) return null;
  const opens = minutesOfDay(today.open);
  const closes = minutesOfDay(today.close);
  if (opens === null || closes === null) return null;
  const minutes = now.getHours() * 60 + now.getMinutes();
  return minutes >= opens && minutes < closes;
}
