/** Цивільний час Києва → UTC-мітка. Депозит і слот рахуються в зоні барбершопу. */
export function kyivWallTime(date: string, time: string): number {
  const guess = new Date(`${date}T${time}:00Z`).getTime();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Kyiv',
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(guess));
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? '0');
  const wall = Date.UTC(
    pick('year'),
    pick('month') - 1,
    pick('day'),
    pick('hour'),
    pick('minute'),
    pick('second')
  );
  return guess - (wall - guess);
}

/** Стіна Києва → мітки, які API пише як UTC (`dateTtimeZ`). */
export function kyivWallToUtc(date: string, time: string): { date: string; time: string } {
  const iso = new Date(kyivWallTime(date, time)).toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
}

function minutes(time: string): number {
  return Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
}

/** Київський слот → мітки API. null, якщо кінець вже наступної доби UTC. */
export function rescheduleSlot(
  current: { startTime: string; endTime: string },
  date: string,
  start: string
): { date: string; start: string; end: string } | null {
  const end = shiftEnd(current.startTime, current.endTime, start);
  const startUtc = kyivWallToUtc(date, start);
  const endUtc = kyivWallToUtc(date, end);
  if (startUtc.date !== endUtc.date) return null;
  return { date: startUtc.date, start: startUtc.time, end: endUtc.time };
}

/** Новий кінець зберігає тривалість візиту — інакше API відхилить перенесення. */
export function shiftEnd(startTime: string, endTime: string, newStart: string): string {
  const next = minutes(newStart) + (minutes(endTime) - minutes(startTime));
  const hours = Math.floor(next / 60);
  const mins = next % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}
