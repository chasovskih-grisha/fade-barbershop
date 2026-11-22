// Instant booking (T-5027): the soonest bookable slot on the selected date,
// skipping busy chairs and times already in the past for today.
import { isoDate } from './dateStrip';
import type { AvailableSlotDto } from './types';

const TIME_PATTERN = /^(\d{1,2}):(\d{2})$/;

export function parseTimeToMinutes(value: string): number | null {
  const match = TIME_PATTERN.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/**
 * Picks the earliest slot with at least one free barber. For today, slots that
 * started before the current minute are not offered.
 */
export function pickInstantSlot(
  slots: readonly AvailableSlotDto[],
  date: string,
  now: Date = new Date()
): AvailableSlotDto | null {
  const isToday = isoDate(now) === date;
  const cutoffMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : -1;

  const candidates = slots
    .filter((slot) => slot.barbers.length > 0)
    .map((slot) => ({ slot, minutes: parseTimeToMinutes(slot.start) }))
    .filter(
      (candidate): candidate is { slot: AvailableSlotDto; minutes: number } =>
        candidate.minutes !== null && candidate.minutes >= cutoffMinutes
    )
    .sort((left, right) => left.minutes - right.minutes);

  return candidates[0]?.slot ?? null;
}
