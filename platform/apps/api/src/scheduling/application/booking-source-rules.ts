// ANL-004: канал запису — закритий набір (розріз джерела в аналітиці).
// REF-WEB-02: коментар ≤500. Винесено з book-appointment.use-case
// (гейт max-lines; спільне з book-appointment-any-barber).
import { type BookingSource } from '../domain/booking';
import { isKnownBookingSource } from '../domain/booking-source';
import { InvalidSlotError } from '../domain/slot-validator';
import type { TimeSlotData } from '../domain/slot-validator';
import { dayOfWeekIndex } from '../domain/day-of-week';

// prettier-ignore
export function assertSnapshots(reference?: { appointmentComment?: string }, origin?: { source?: BookingSource }): void {
  if (reference?.appointmentComment !== undefined && reference.appointmentComment.length > 500) throw InvalidSlotError.of('Comment must be 500 characters or fewer');
  if (origin?.source !== undefined && !isKnownBookingSource(origin.source)) throw InvalidSlotError.of(`Unknown booking source: ${origin.source}`);
}

/** Валідований денний проміжок слота: дата → start/end + факт день тижня. */
// prettier-ignore
export function resolveDatedSpan(slot: TimeSlotData): { start: Date; end: Date; slot: TimeSlotData } {
  if (!slot.date || !/^\d{4}-\d{2}-\d{2}$/.test(slot.date)) throw InvalidSlotError.of('A booking date is required');
  const start = new Date(`${slot.date}T${slot.start}:00.000Z`);
  const end = new Date(`${slot.date}T${slot.end}:00.000Z`);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) throw InvalidSlotError.of('Invalid booking date');
  const actualDay = dayOfWeekIndex(start);
  if (slot.dayOfWeek !== actualDay) throw InvalidSlotError.of('dayOfWeek does not match booking date');
  return { start, end, slot: { ...slot, dayOfWeek: actualDay } };
}
