'use client';

// Блок годин роботи у формах локації: 7 рядків Monday-first + валідація
// «відкриття раніше закриття» (та сама семантика, що HoursEditor).
import { HoursDayRow, DAY_NAMES } from './HoursDayRow';
import type { DayHours } from './HoursEditor';

export const defaultWeek = (): DayHours[] =>
  Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    open: '09:00',
    close: '18:00',
    closed: dayOfWeek >= 5,
  }));

export function sortedWeek(hours: DayHours[]): DayHours[] {
  return [...hours].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
}

/** null — валідно; рядок — повідомлення про помилку. */
export function validateHours(hours: DayHours[]): string | null {
  const invalidDay = hours.find(
    (day) => !day.closed && (!day.open || !day.close || day.open >= day.close)
  );
  if (!invalidDay) return null;
  return `${DAY_NAMES[invalidDay.dayOfWeek]}: час відкриття має бути раніше за час закриття.`;
}

/** Fieldset з рядками днів; злиття змін дня — тут, форми лишаються тонкими. */
export function HoursFieldset({
  hours,
  onChange,
}: {
  hours: DayHours[];
  onChange: (hours: DayHours[]) => void;
}) {
  const changeDay = (dayOfWeek: number, changes: Partial<DayHours>) => {
    onChange(hours.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, ...changes } : day)));
  };
  return (
    <fieldset className="rounded-card border border-line p-4">
      <legend className="px-1 font-display text-h4">Години роботи</legend>
      <div className="space-y-3">
        {sortedWeek(hours).map((day) => (
          <HoursDayRow key={day.dayOfWeek} day={day} onChange={changeDay} />
        ))}
      </div>
    </fieldset>
  );
}
