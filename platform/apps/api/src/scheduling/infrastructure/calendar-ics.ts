// Чисте форматування ICS (RFC 5545) для експорту візиту (T-4446a): без Nest/Prisma.

export interface IcsBooking {
  id: string;
  start: Date;
  end: Date;
  barberId: string;
  agreedPrice: number | null;
  finalPrice: number | null;
  appliedDiscounts: unknown;
  haircutReferenceId: string | null;
  /** Доменний статус візиту (`null` у старих рядків): скасований → `STATUS:CANCELLED`. */
  status: string | null;
  /** Версія рядка візиту: росте після перенесення — це `SEQUENCE` події. */
  version: number;
}

export interface IcsLocation {
  name: string | null;
  address: string | null;
}

/**
 * UTC-момент у форматі ICS (`YYYYMMDDTHHMMSSZ`).
 *
 * `Z` обов'язковий: без нього календар трактує час як «плаваючий» і показує
 * його в поясі пристрою, а не в поясі локації (візит 12:00 Kyiv улітку — це
 * 09:00Z, узимку — 10:00Z).
 */
export function formatIcsDate(date: Date): string {
  const iso = date.toISOString();
  return [
    iso.slice(0, 4),
    iso.slice(5, 7),
    iso.slice(8, 10),
    'T',
    iso.slice(11, 13),
    iso.slice(14, 16),
    iso.slice(17, 19),
    'Z',
  ].join('');
}

/** RFC 5545 §3.3.11: `\` `;` `,` і переводи рядків екрануються у значеннях. */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Prisma Json не гарантує масив — рахуємо знижки лише для масиву. */
export function discountCountOf(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function priceTextOf(booking: IcsBooking): string {
  if (booking.finalPrice !== null) return `Final price: $${booking.finalPrice}`;
  if (booking.agreedPrice !== null) return `Agreed price: $${booking.agreedPrice}`;
  return 'Price on request';
}

function locationTextOf(location: IcsLocation | null): string {
  const parts = [location?.name, location?.address].filter(
    (part): part is string => Boolean(part && part.trim())
  );
  return parts.join(', ');
}

function descriptionOf(booking: IcsBooking, location: IcsLocation | null): string {
  const duration = Math.round((booking.end.getTime() - booking.start.getTime()) / 60000);
  const parts = [
    `Barber ID: ${booking.barberId}`,
    `Location: ${location?.name || 'Unknown location'}`,
    ...(location?.address ? [`Address: ${location.address}`] : []),
    `Duration: ${duration} min`,
    priceTextOf(booking),
    `Service: ${booking.haircutReferenceId ? 'Haircut' : 'Service'}`,
    `Discounts applied: ${discountCountOf(booking.appliedDiscounts)}`,
    'FADE Barbershop — book at fade.barber',
  ];
  return parts.join('\n');
}

/**
 * Збирає валідний VCALENDAR з одним VEVENT.
 *
 * `UID` прив'язаний до візиту, а `SEQUENCE` — до версії рядка: повторний
 * імпорт після перенесення оновлює ту саму подію, а скасований візит несе
 * `STATUS:CANCELLED` замість дубля.
 */
export function buildIcs(booking: IcsBooking, location: IcsLocation | null): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FADE Barber//Calendar Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:fade-booking-${booking.id}@fade.barber`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(booking.start)}`,
    `DTEND:${formatIcsDate(booking.end)}`,
    `SEQUENCE:${Math.max(0, Math.trunc(booking.version))}`,
    `STATUS:${booking.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'}`,
    `SUMMARY:${escapeIcsText(
      `FADE Haircut - ${booking.haircutReferenceId ? 'Appointment' : 'Booking'}`
    )}`,
    `LOCATION:${escapeIcsText(locationTextOf(location))}`,
    `DESCRIPTION:${escapeIcsText(descriptionOf(booking, location))}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
