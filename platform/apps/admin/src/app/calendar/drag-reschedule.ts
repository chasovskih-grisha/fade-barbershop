// Правила перетягування візиту в календарі (T-4524/T-4524a): який статус
// можна тягнути і як зі слота-цілі зібрати команду RescheduleAppointment.
// Чистий модуль без React, щоб правило жило в одному місці (DRY) — drag і
// клавіатура користуються тим самим; саму бізнес-логіку переносу валідує
// use case (T-4533), drag лише формує ту саму команду, що й картка.
import type { CalendarVisit } from './visit-status';

/** Переносити можна лише «живий» візит; термінальні — ні (як у use case). */
const MOVABLE = new Set(['booked', 'confirmed']);

export function canDrag(visit: CalendarVisit): boolean {
  return MOVABLE.has(visit.status);
}

export interface RescheduleWhen {
  date: string;
  start: string;
  end: string;
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const MINUTES_IN_DAY = 24 * 60;
const toMinutes = (time: string): number =>
  Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
const pad = (value: number): string => String(value).padStart(2, '0');
const hhmm = (iso: string): string => iso.slice(11, 16);
const isoDate = (iso: string): string => iso.slice(0, 10);

/**
 * Команда перенесення на слот-ціль: дата — з візиту (сітка денна), початок —
 * ціль, кінець — початок + власна тривалість візиту (перенос не міняє довжину,
 * T-4533). null — невалідний час або вихід за добу: краще не робити запит.
 */
export function rescheduleWhen(visit: CalendarVisit, targetStart: string): RescheduleWhen | null {
  if (!HHMM.test(targetStart)) return null;
  const duration = toMinutes(hhmm(visit.end)) - toMinutes(hhmm(visit.start));
  if (duration <= 0) return null;
  const endMinutes = toMinutes(targetStart) + duration;
  // Кінець має лишатися валідним HH:MM у межах доби (24:00 не існує).
  if (endMinutes >= MINUTES_IN_DAY) return null;
  const end = `${pad(Math.floor(endMinutes / 60))}:${pad(endMinutes % 60)}`;
  return { date: isoDate(visit.start), start: targetStart, end };
}
