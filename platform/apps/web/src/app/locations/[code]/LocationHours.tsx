import type { OpeningHour } from '@/lib/api/locations';
import { domainDayIndex } from '../location-today';

// Години роботи (web-screens §2, T-4832a): сьогоднішній рядок — перший і
// позначений, решта днів лишається в тижневому порядку; вихідні — «Вихідний»
// (MNG-ADM-03). Порожній тиждень не зникає: компонент каже «Графік ще не
// вказано», а не лишає порожню картку.

// Домен: 0 = понеділок … 6 = неділя (opening-hours.ts), не Date.getDay().
const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'] as const;

const interval = (day: OpeningHour) =>
  day.closed || !day.open || !day.close ? 'Вихідний' : `${day.open}–${day.close}`;

export default function LocationHours({
  hours,
  now = new Date(),
}: {
  hours: OpeningHour[];
  /** Момент «сьогодні»; тест фіксує його, щоб не залежати від дня запуску. */
  now?: Date;
}) {
  if (hours.length === 0) {
    return (
      <section className="flex flex-col gap-2">
        <h2 className="font-display text-h4">Години роботи</h2>
        <p className="text-body text-fg-secondary">Графік ще не вказано</p>
      </section>
    );
  }

  const todayIndex = domainDayIndex(now);
  const sorted = [...hours].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  const ordered = [
    ...sorted.filter((day) => day.dayOfWeek === todayIndex),
    ...sorted.filter((day) => day.dayOfWeek !== todayIndex),
  ];

  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-display text-h4">Години роботи</h2>
      <ul className="flex flex-col gap-1 text-body">
        {ordered.map((day) => {
          const today = day.dayOfWeek === todayIndex;
          return (
            <li
              key={day.dayOfWeek}
              aria-current={today ? 'date' : undefined}
              data-today={today ? 'true' : undefined}
              className={`flex justify-between gap-4 rounded-input px-2 py-1 ${
                today ? 'bg-surface-sunken font-semibold text-fg' : 'text-fg-secondary'
              }`}
            >
              <span>
                {DAY_NAMES[day.dayOfWeek]}
                {today ? ' · Сьогодні' : ''}
              </span>
              <span className={today ? 'text-fg' : undefined}>{interval(day)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
