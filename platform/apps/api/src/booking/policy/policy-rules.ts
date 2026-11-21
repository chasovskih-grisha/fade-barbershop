// Чисті правила онлайн-букінгу (T-4542). Кожне правило повертає причину
// блокування з готовим текстом для фронту — той самий набір віддає
// GET /booking/policy, тож UI не дублює формулювання.
import type { OnlineBookingPolicy } from './online-booking-policy';

export type BookingBlockCode =
  | 'min_lead_time'
  | 'horizon'
  | 'cancellation_deadline'
  | 'reschedule_deadline'
  | 'max_active_bookings'
  | 'duplicate_booking'
  | 'no_show_block'
  | 'guest_booking_disabled';

export interface BookingBlock {
  code: BookingBlockCode;
  message: string;
}

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

export function checkLeadTime(
  policy: OnlineBookingPolicy,
  start: Date,
  now: Date
): BookingBlock | null {
  const minutes = (start.getTime() - now.getTime()) / MINUTE_MS;
  if (minutes >= policy.minLeadMinutes) return null;
  return {
    code: 'min_lead_time',
    message: `Онлайн-запис можливий не раніше ніж за ${policy.minLeadMinutes} хв до початку`,
  };
}

export function checkHorizon(
  policy: OnlineBookingPolicy,
  start: Date,
  now: Date
): BookingBlock | null {
  const days = (start.getTime() - now.getTime()) / (24 * HOUR_MS);
  if (days <= policy.maxHorizonDays) return null;
  return {
    code: 'horizon',
    message: `Онлайн-запис доступний не далі ніж за ${policy.maxHorizonDays} днів`,
  };
}

export function checkCancellationDeadline(
  policy: OnlineBookingPolicy,
  start: Date,
  now: Date
): BookingBlock | null {
  const hours = (start.getTime() - now.getTime()) / HOUR_MS;
  if (hours >= policy.cancellationDeadlineHours) return null;
  return {
    code: 'cancellation_deadline',
    message: `Онлайн-скасування — не пізніше ніж за ${policy.cancellationDeadlineHours} год; зверніться до салону`,
  };
}

export function checkRescheduleDeadline(
  policy: OnlineBookingPolicy,
  start: Date,
  now: Date
): BookingBlock | null {
  const hours = (start.getTime() - now.getTime()) / HOUR_MS;
  if (hours >= policy.rescheduleDeadlineHours) return null;
  return {
    code: 'reschedule_deadline',
    message: `Онлайн-перенесення — не пізніше ніж за ${policy.rescheduleDeadlineHours} год; зверніться до салону`,
  };
}

export function checkActiveBookings(
  policy: OnlineBookingPolicy,
  activeCount: number
): BookingBlock | null {
  if (activeCount < policy.maxActiveBookings) return null;
  return {
    code: 'max_active_bookings',
    message: `Максимум ${policy.maxActiveBookings} активні записи — скасуйте попередній, щоб записатись`,
  };
}

export function checkDuplicate(hasDuplicate: boolean): BookingBlock | null {
  return hasDuplicate
    ? { code: 'duplicate_booking', message: 'У вас уже є запис на цей час до цього барбера' }
    : null;
}

export function checkNoShowBlock(
  policy: OnlineBookingPolicy,
  noShows: number
): BookingBlock | null {
  if (policy.noShowBlock.count === 0 || noShows < policy.noShowBlock.count) return null;
  return {
    code: 'no_show_block',
    message: 'Онлайн-запис недоступний через неявки — зверніться до салону',
  };
}

export function checkGuestBooking(
  policy: OnlineBookingPolicy,
  hasAccount: boolean
): BookingBlock | null {
  if (policy.allowGuestBooking || hasAccount) return null;
  return { code: 'guest_booking_disabled', message: 'Для запису потрібен акаунт' };
}
