'use client';

// Приховані поля форми візиту (T-4409/T-4738): барбер, дата, слот, послуга і
// її тривалість — те, що VisitForm читає перед POST /admin/bookings.
import type { AvailableSlotDto } from './types';

export function VisitHiddenFields({
  serviceId,
  serviceDuration,
  date,
  barberId,
  picked,
}: {
  serviceId: string;
  serviceDuration: number;
  date: string;
  barberId: string;
  picked: AvailableSlotDto | null;
}) {
  return (
    <>
      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="serviceDuration" value={serviceDuration} />
      <input type="hidden" name="selectedBarberId" value={barberId} />
      <input type="hidden" name="selectedDate" value={date} />
      <input type="hidden" name="selectedStart" value={picked?.start ?? ''} />
      <input type="hidden" name="selectedEnd" value={picked?.end ?? ''} />
    </>
  );
}
