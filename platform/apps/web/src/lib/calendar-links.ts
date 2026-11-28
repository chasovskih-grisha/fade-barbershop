// Посилання «Додати в календар» для картки візиту (T-4446b). Чисті функції:
// жодного DOM — клік відкриває системний календар (.ics) або Google Calendar.

export interface CalendarLinkInput {
  title: string;
  /** ISO-момент початку візиту з відповіді сервера. */
  start: string;
  /** ISO-момент кінця візиту. */
  end: string;
  location?: string | undefined;
  details?: string | undefined;
}

/**
 * UTC-штамп `YYYYMMDDTHHMMSSZ` — та сама форма, що в `.ics`-файлі.
 * `null` для невалідної дати: посилання без часу не показуємо.
 */
function utcStamp(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const stamp = date.toISOString();
  return [
    stamp.slice(0, 4),
    stamp.slice(5, 7),
    stamp.slice(8, 10),
    'T',
    stamp.slice(11, 13),
    stamp.slice(14, 16),
    stamp.slice(17, 19),
    'Z',
  ].join('');
}

/** Посилання Google Calendar `TEMPLATE` з початком і кінцем візиту. */
export function googleCalendarUrl(input: CalendarLinkInput): string | null {
  const start = utcStamp(input.start);
  const end = utcStamp(input.end);
  if (!start || !end) return null;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: input.title,
    dates: `${start}/${end}`,
  });
  if (input.details) params.set('details', input.details);
  if (input.location) params.set('location', input.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Шлях cookie-проксі Next до `.ics` власного візиту. */
export function icsDownloadPath(appointmentId: string): string {
  return `/api/appointments/${encodeURIComponent(appointmentId)}/calendar`;
}
