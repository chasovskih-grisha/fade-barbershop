import { confirmBooking } from './bookingApi';
import type { AvailableSlotDto, LocationDto, ServiceDto } from './types';

export type ReferenceSource = 'ai' | 'upload' | 'none';

export async function submitBooking(input: {
  location: LocationDto;
  service: ServiceDto;
  slot: AvailableSlotDto;
  date: string;
  barberId: string;
  comment: string;
  referenceSource: ReferenceSource;
  selectedVariantObjectKey: string | null;
}) {
  const haircutReferenceId =
    input.referenceSource !== 'none' ? input.selectedVariantObjectKey : undefined;
  return confirmBooking({
    locationId: input.location.id,
    serviceId: input.service.id,
    date: input.date,
    start: input.slot.start,
    end: input.slot.end,
    ...(input.barberId ? { barberId: input.barberId } : {}),
    ...(input.comment ? { comment: input.comment } : {}),
    ...(haircutReferenceId ? { haircutReferenceId } : {}),
  });
}
