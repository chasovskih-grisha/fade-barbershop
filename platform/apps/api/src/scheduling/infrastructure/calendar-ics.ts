// Чисте форматування ICS для експорту бронювання (T-2500f): без Nest/Prisma.

export interface IcsBooking {
  id: string;
  start: Date;
  end: Date;
  barberId: string;
  agreedPrice: number | null;
  finalPrice: number | null;
  appliedDiscounts: unknown;
  haircutReferenceId: string | null;
}

export interface IcsLocation {
  name: string | null;
  address: string | null;
}

/** UTC-час у форматі ICS (YYYYMMDDTHHMMSS), без позначення поясу. */
export function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace('T', '').replace('Z', '');
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

/** Збирає валідний VCALENDAR з одним VEVENT для бронювання. */
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
    `SUMMARY:FADE Haircut - ${booking.haircutReferenceId ? 'Appointment' : 'Booking'}`,
    `DESCRIPTION:${descriptionOf(booking, location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
