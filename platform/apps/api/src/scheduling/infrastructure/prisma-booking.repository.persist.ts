// Атомарне створення Booking усередині Serializable-транзакції (T-040c):
// поріг активних крісел (sweep-line hasChairCapacity) + конфлікт барбера +
// create із снепшотами T-043/T-046. Мапінг P2034 — у репозиторії.
import type { Prisma } from '@prisma/client';
import { BookingConflictError, type Booking } from '../domain/booking';
import { hasChairCapacity } from '../domain/chair-capacity';

export async function persistBookingWithCapacity(
  tx: Prisma.TransactionClient,
  booking: Booking
): Promise<void> {
  const chairs = await tx.chair.count({
    where: { locationId: booking.locationId, active: true },
  });
  // prettier-ignore
  const overlapping = await tx.booking.findMany({ where: { locationId: booking.locationId, start: { lt: booking.end }, end: { gt: booking.start } }, select: { start: true, end: true } });
  if (
    !hasChairCapacity({ existing: overlapping, start: booking.start, end: booking.end, chairs })
  ) {
    throw new BookingConflictError('No free chairs for this slot');
  }
  // prettier-ignore
  const barberConflict = await tx.booking.findFirst({ where: { barberId: booking.barberId, start: { lt: booking.end }, end: { gt: booking.start } }, select: { id: true } });
  if (barberConflict) throw new BookingConflictError('Barber is already booked for this slot');
  // Снепшот референса/коментаря (T-043), джерела (T-046) і умов депозиту
  // (PAY-ADM-09) — nullable-поля.
  const deposit = booking.deposit;
  // prettier-ignore
  const data = { id: booking.id, barberId: booking.barberId, locationId: booking.locationId, serviceId: booking.serviceId, agreedPrice: booking.agreedPrice, appliedDiscounts: booking.appliedDiscounts ?? undefined, finalPrice: booking.finalPrice, agreedDuration: booking.agreedDuration, fulfillmentMode: booking.fulfillmentMode, start: booking.start, end: booking.end, version: booking.version, haircutReferenceId: booking.haircutReferenceId, appointmentComment: booking.appointmentComment, clientId: booking.clientId, source: booking.source, surgeBasisPoints: booking.surgeBasisPoints, surgeRuleId: booking.surgeRuleId, depositAmount: deposit?.amount ?? null, depositPercent: deposit?.percent ?? null, depositRounding: deposit?.rounding ?? null, cancellationWindowHours: deposit?.cancellationWindowHours ?? null } as unknown as Prisma.BookingUncheckedCreateInput;
  await tx.booking.create({ data });
}
