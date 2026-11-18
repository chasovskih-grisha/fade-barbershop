'use client';

import type { DayHours } from './HoursEditor';

const DAY_NAMES = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П’ятниця', 'Субота', 'Неділя'];

export function HoursDayRow({
  day,
  onChange,
}: {
  day: DayHours;
  onChange: (dayOfWeek: number, changes: Partial<DayHours>) => void;
}) {
  return (
    <div className="grid items-center gap-3 sm:grid-cols-[9rem_6rem_1fr_1fr]">
      <span>{DAY_NAMES[day.dayOfWeek]}</span>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={day.closed}
          onChange={(event) =>
            onChange(day.dayOfWeek, {
              closed: event.target.checked,
              open: event.target.checked ? null : (day.open ?? '09:00'),
              close: event.target.checked ? null : (day.close ?? '18:00'),
            })
          }
        />
        Вихідний
      </label>
      <label className="flex items-center gap-2">
        Від{' '}
        <input
          aria-label={`${DAY_NAMES[day.dayOfWeek]}: відкриття`}
          type="time"
          step={900}
          required={!day.closed}
          disabled={day.closed}
          value={day.open ?? ''}
          onChange={(event) => onChange(day.dayOfWeek, { open: event.target.value || null })}
        />
      </label>
      <label className="flex items-center gap-2">
        До{' '}
        <input
          aria-label={`${DAY_NAMES[day.dayOfWeek]}: закриття`}
          type="time"
          step={900}
          required={!day.closed}
          disabled={day.closed}
          value={day.close ?? ''}
          onChange={(event) => onChange(day.dayOfWeek, { close: event.target.value || null })}
        />
      </label>
    </div>
  );
}

export { DAY_NAMES };
