import type { Booking } from '../domain/booking';
import type { AvailabilityWindowData } from '../domain/availability';
import type { OpeningHours } from '../../locations/domain/opening-hours';
import { InvalidScheduleInputError, ScheduleConflictError } from './availability-errors';
import { dayOfWeekIndex } from '../domain/day-of-week';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const minutes = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));

export function validateAvailability(
  windows: AvailabilityWindowData[],
  opening: OpeningHours,
  bookings: Booking[]
): void {
  validateWindowShape(windows);
  windows.forEach((window) => assertWithinOpeningHours(window, opening));
  if (bookings.some((booking) => !containsBooking(windows, booking))) {
    throw new ScheduleConflictError('Availability conflicts with an existing booking');
  }
}

/** Структурні правила вікон без прив'язки до годин локації: формат, start<end,
 *  макс. 2/день, без перетинів. Спільне ядро для адмінського та self-service
 *  шляхів — політику годин накладає викликач. */
export function validateWindowShape(windows: AvailabilityWindowData[]): void {
  const days = new Map<number, AvailabilityWindowData[]>();
  windows.forEach((window) => addWindow(window, days));
}

function addWindow(
  window: AvailabilityWindowData,
  days: Map<number, AvailabilityWindowData[]>
): void {
  assertTimeWindow(window);
  const sameDay = days.get(window.dayOfWeek) ?? [];
  if (sameDay.length >= 2) throw new ScheduleConflictError('More than 2 windows in a day');
  if (sameDay.some((other) => overlaps(window, other)))
    throw new ScheduleConflictError('Overlapping windows');
  days.set(window.dayOfWeek, [...sameDay, window]);
}

function assertTimeWindow(window: AvailabilityWindowData): void {
  if (
    !Number.isInteger(window.dayOfWeek) ||
    window.dayOfWeek < 0 ||
    window.dayOfWeek > 6 ||
    !TIME_RE.test(window.start) ||
    !TIME_RE.test(window.end)
  ) {
    throw new InvalidScheduleInputError('Invalid availability day or time');
  }
  if (minutes(window.start) >= minutes(window.end))
    throw new InvalidScheduleInputError('Start must be before end');
}

function assertWithinOpeningHours(window: AvailabilityWindowData, opening: OpeningHours): void {
  const day = opening.days.find((item) => item.dayOfWeek === window.dayOfWeek);
  if (
    !day ||
    day.closed ||
    !day.open ||
    !day.close ||
    minutes(window.start) < minutes(day.open) ||
    minutes(window.end) > minutes(day.close)
  ) {
    throw new InvalidScheduleInputError('Availability must fit within location opening hours');
  }
}

function overlaps(left: AvailabilityWindowData, right: AvailabilityWindowData): boolean {
  return minutes(left.start) < minutes(right.end) && minutes(right.start) < minutes(left.end);
}

function containsBooking(windows: AvailabilityWindowData[], booking: Booking): boolean {
  const dayOfWeek = dayOfWeekIndex(booking.start);
  const start = booking.start.getUTCHours() * 60 + booking.start.getUTCMinutes();
  const end = booking.end.getUTCHours() * 60 + booking.end.getUTCMinutes();
  return windows.some(
    (window) =>
      window.dayOfWeek === dayOfWeek && start >= minutes(window.start) && end <= minutes(window.end)
  );
}
