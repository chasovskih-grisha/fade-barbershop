// Конфлікти графіка з заброньованими візитами (T-230, SCH-004). Зміна графіка
// ніколи не скасовує візит: якщо вікна більше не покривають бронювання, зміна
// не застосовується, а конфлікти повертаються списком (клієнт · час · послуга)
// — барбер лише бачить їх і просить адміна перенести. Домен без Nest/Prisma.

import type { Booking } from './booking';
import type { AvailabilityWindowData } from './availability';
import { dayOfWeekIndex } from './day-of-week';
import { toMinutes } from './time-utils';

export interface ScheduleConflict {
  bookingId: string;
  clientId: string | null;
  serviceId: string | null;
  start: string; // 'HH:MM'
  end: string;
}

/** Візит не покритий жодним вікном того самого дня → конфлікт. */
function conflictsWith(windows: AvailabilityWindowData[], booking: Booking): boolean {
  const day = dayOfWeekIndex(booking.start);
  const start = booking.start.getUTCHours() * 60 + booking.start.getUTCMinutes();
  const end = booking.end.getUTCHours() * 60 + booking.end.getUTCMinutes();
  return !windows.some(
    (window) =>
      window.dayOfWeek === day && start >= toMinutes(window.start) && end <= toMinutes(window.end)
  );
}

function clock(date: Date): string {
  const pad = (value: number) => value.toString().padStart(2, '0');
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

function toConflict(booking: Booking): ScheduleConflict {
  return {
    bookingId: booking.id,
    clientId: booking.clientId,
    serviceId: booking.serviceId,
    start: clock(booking.start),
    end: clock(booking.end),
  };
}

export function findScheduleConflicts(
  windows: AvailabilityWindowData[],
  bookings: Booking[]
): ScheduleConflict[] {
  return bookings.filter((booking) => conflictsWith(windows, booking)).map(toConflict);
}
