// Slot grid loop for /slots: step, buffer between bookings and the last-minute
// cutoff are applied per slot here (T-4522). Split from available-slots.ts
// (gates max-lines/complexity/max-statements).

import { minutesToTime } from '../../scheduling/domain/time-utils';
import { hasChairCapacity } from '../../scheduling/domain/chair-capacity';
import type { TimeSlotData } from '../../scheduling/domain/slot-validator';
import type { Booking } from '../../scheduling/domain/booking';
import type { AvailableSlotDto } from '../dto/available-slot.dto';
import { candidates, type SlotContext } from './available-slots-helpers';
import { isClosedByLastMinute, type SlotPolicySnapshot } from './available-slots.policy';

export interface SlotGridInput {
  ctx: SlotContext;
  policy: SlotPolicySnapshot;
  date: string;
  dayOfWeek: number;
  window: { start: number; end: number };
  now: Date;
  /** Past requested dates skip cutoffs (legacy behavior, see available-slots). */
  isPastDate: boolean;
  /** All barber bookings overlapping the day (any location). */
  barberBookings: Booking[];
  /** Bookings of this location (chair capacity). */
  existing: Booking[];
  chairs: number;
}

/** Grid loop: step, buffer between bookings, last-minute cutoff (T-4522). */
export function buildSlotGrid(input: SlotGridInput): AvailableSlotDto[] {
  const { ctx, policy, date, dayOfWeek, window, now, isPastDate } = input;
  const step = policy.stepMinutes;
  // Buffer between bookings (T-4522): after a booking ends the barber is busy
  // for bufferMinutes more - slots starting inside the buffer are trimmed.
  const bufferMs = policy.bufferMinutes * 60_000;
  const slots: AvailableSlotDto[] = [];
  for (let t = window.start; t + ctx.duration <= window.end; t += step) {
    const slotStart = minutesToTime(t);
    const slotEnd = minutesToTime(t + ctx.duration);
    const startAt = new Date(`${date}T${slotStart}:00.000Z`);
    const endAt = new Date(`${date}T${slotEnd}:00.000Z`);
    const busy = (id: string) =>
      input.barberBookings.some(
        (b) =>
          b.barberId === id && b.start < endAt && b.end.getTime() + bufferMs > startAt.getTime()
      );
    const slot: TimeSlotData = { date, dayOfWeek, start: slotStart, end: slotEnd };
    // Last-minute (T-4522): slot closed for booking - disabled, not hidden.
    const closed = !isPastDate && isClosedByLastMinute(startAt, now, policy.lastMinuteMinutes);
    const available = closed
      ? []
      : hasChairCapacity({
            existing: input.existing,
            start: startAt,
            end: endAt,
            chairs: input.chairs,
          })
        ? candidates(ctx, slot).filter((id) => !busy(id))
        : [];
    slots.push({ start: slotStart, end: slotEnd, barbers: available });
  }
  return slots;
}
