'use client';

import { Field } from '@fade/ui';
import { clampDay, daysInMonth } from './birthday';

const MONTH_NAMES = [
  'січня',
  'лютого',
  'березня',
  'квітня',
  'травня',
  'червня',
  'липня',
  'серпня',
  'вересня',
  'жовтня',
  'листопада',
  'грудня',
];

const selectClass =
  'h-11 rounded-input border border-line bg-surface-base px-3 font-text text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue';

/** Два селектори дня й місяця без року (T-4730b). 0 — не вибрано. */
export function BirthdayFields({
  day,
  month,
  onDay,
  onMonth,
}: {
  day: number;
  month: number;
  onDay: (value: number) => void;
  onMonth: (value: number) => void;
}) {
  const monthDays = month > 0 ? daysInMonth(month) : 31;
  // Shortening the month (31 -> February) must drop the impossible day,
  // otherwise the form submits 31 February and the API rejects it (400).
  const pickMonth = (value: number) => {
    onMonth(value);
    onDay(clampDay(day, value));
  };
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field id="birth-day" label="День">
        <select
          id="birth-day"
          className={selectClass}
          value={day}
          onChange={(e) => onDay(Number(e.target.value))}
        >
          <option value={0}>—</option>
          {Array.from({ length: monthDays }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </Field>
      <Field id="birth-month" label="Місяць">
        <select
          id="birth-month"
          className={selectClass}
          value={month}
          onChange={(e) => pickMonth(Number(e.target.value))}
        >
          <option value={0}>—</option>
          {MONTH_NAMES.map((name, i) => (
            <option key={name} value={i + 1}>
              {name}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}
