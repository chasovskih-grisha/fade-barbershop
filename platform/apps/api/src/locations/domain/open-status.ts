// OpenStatus — «відчинено/зачинено зараз» для публічних поверхонь (T-4442).
// Рахується в поясі локації, не клієнта: той, хто дивиться з іншого поясу,
// бачить той самий статус, що й на дверях. Виняток дня (T-4414) перекриває
// тижневий графік. Без графіка — 'undefined', а не вигадане «зачинено».

import type { OpeningHours } from './opening-hours';

export type OpenStatus =
  | { state: 'open'; closesAt: string }
  | { state: 'closed'; opensAt: string | null; reason: string | null }
  | { state: 'undefined' };

/** Мінімум полів винятку, потрібний статусу; `WorkdayExceptionData` підходить структурно. */
export interface DayException {
  date: string;
  closed: boolean;
  open: string | null;
  close: string | null;
  reason: string;
}

export interface OpenStatusInput {
  hours: OpeningHours | null;
  exceptions?: readonly DayException[];
  now: Date;
  timeZone: string;
}

interface LocalMoment {
  date: string;
  minutes: number;
  dayOfWeek: number;
}

const WEEKDAY_INDEX: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

function localMoment(now: Date, timeZone: string): LocalMoment {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
    dayOfWeek: WEEKDAY_INDEX[get('weekday')] ?? 0,
  };
}

function toMinutes(time: string): number {
  const [hour = 0, minute = 0] = time.split(':').map(Number);
  return hour * 60 + minute;
}

function statusWithin(input: {
  open: string | null;
  close: string | null;
  minutes: number;
  reason: string | null;
}): OpenStatus {
  if (!input.open || !input.close) {
    return { state: 'closed', opensAt: null, reason: input.reason };
  }
  if (input.minutes < toMinutes(input.open)) {
    return { state: 'closed', opensAt: input.open, reason: input.reason };
  }
  if (input.minutes >= toMinutes(input.close)) {
    return { state: 'closed', opensAt: null, reason: input.reason };
  }
  return { state: 'open', closesAt: input.close };
}

export function openStatusAt(input: OpenStatusInput): OpenStatus {
  if (!input.hours) return { state: 'undefined' };
  const moment = localMoment(input.now, input.timeZone);

  const exception = input.exceptions?.find((item) => item.date === moment.date);
  if (exception) {
    if (exception.closed) {
      return { state: 'closed', opensAt: null, reason: exception.reason };
    }
    return statusWithin({
      open: exception.open,
      close: exception.close,
      minutes: moment.minutes,
      reason: exception.reason,
    });
  }

  const day = input.hours.days.find((item) => item.dayOfWeek === moment.dayOfWeek);
  if (!day) return { state: 'undefined' };
  if (day.closed) return { state: 'closed', opensAt: null, reason: null };
  return statusWithin({ open: day.open, close: day.close, minutes: moment.minutes, reason: null });
}
