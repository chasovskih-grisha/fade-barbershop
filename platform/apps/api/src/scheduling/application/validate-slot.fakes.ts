import { OpeningHours, DayHours } from '../../locations/domain/opening-hours';

/** Helper to create OpeningHours with a single day (others closed) */
export function makeOpeningHours(opts: {
  day: number;
  open: string;
  close: string;
  closed?: boolean;
}): OpeningHours {
  const { day, open, close, closed = false } = opts;
  const days: DayHours[] = [];
  for (let i = 0; i < 7; i++) {
    if (i === day) {
      days.push({ dayOfWeek: i, open: closed ? null : open, close: closed ? null : close, closed });
    } else {
      days.push({ dayOfWeek: i, open: null, close: null, closed: true });
    }
  }
  return OpeningHours.of(days);
}

export const SERVICE_DURATION = 30; // minutes
