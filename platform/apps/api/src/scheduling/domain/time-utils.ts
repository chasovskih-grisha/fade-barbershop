export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':');
  return Number(hours) * 60 + Number(minutes ?? 0);
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}`;
}

/**
 * Calculates the offset in minutes for a given date and IANA time zone.
 */
export function getZonedOffsetMinutes(date: Date, timeZone: string): number {
  try {
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
    return Math.round((tzDate.getTime() - utcDate.getTime()) / (60 * 1000));
  } catch {
    return 0;
  }
}

/**
 * Validates whether a time interval is safe across potential DST transitions in an IANA time zone.
 * Detects spring-forward gaps (where timezone offset changes mid-interval).
 */
export function isDstTransitionSafe(startDate: Date, endDate: Date, timeZone: string): boolean {
  try {
    const offsetStart = getZonedOffsetMinutes(startDate, timeZone);
    const offsetEnd = getZonedOffsetMinutes(endDate, timeZone);
    return offsetStart === offsetEnd;
  } catch {
    return true;
  }
}
