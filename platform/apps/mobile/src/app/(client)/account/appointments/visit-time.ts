function minutes(time: string): number {
  const parts = time.split(':');
  if (parts.length < 2) return 0;
  return Number(parts[0]) * 60 + Number(parts[1]);
}

export function shiftEnd(startTime: string, endTime: string, newStart: string): string {
  const duration = minutes(endTime) - minutes(startTime);
  const next = minutes(newStart) + (duration > 0 ? duration : 45);
  const hours = Math.floor(next / 60) % 24;
  const mins = next % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function rescheduleSlot(
  current: { startTime: string; endTime: string },
  date: string,
  start: string
): { date: string; start: string; end: string } {
  const end = shiftEnd(current.startTime, current.endTime, start);
  return { date, start, end };
}
