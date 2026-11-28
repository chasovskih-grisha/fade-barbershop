// Request-time helpers for slot generation: date parsing, duration alignment,
// day window. Split from available-slots-helpers.ts (gate max-lines).

import { HttpException, HttpStatus } from '@nestjs/common';
import type { OpeningHours } from '../../locations/domain/opening-hours';
import { toMinutes } from '../../scheduling/domain/time-utils';
import type { AvailableSlotsDeps } from './available-slots-helpers';

export function dayStart(date: string): Date {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  const valid =
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date;
  if (!valid) throw new HttpException('A valid booking date is required', HttpStatus.BAD_REQUEST);
  return parsed;
}

export async function resolveDuration(
  deps: AvailableSlotsDeps,
  input: { locationId: string; serviceId: string; fulfillmentMode?: string; variantLabel?: string }
): Promise<number> {
  const services = await deps.serviceRepo.catalogForLocation(input.locationId);
  const service = services.find((s) => s.id === input.serviceId);
  if (!service) throw new HttpException('Service not found', HttpStatus.NOT_FOUND);
  // T-4419: обраний варіант задає тривалість; без нього — базова (як раніше).
  const variant =
    input.variantLabel === undefined
      ? undefined
      : service.variants?.find((candidate) => candidate.label === input.variantLabel);
  if (input.variantLabel !== undefined && !variant) {
    throw new HttpException(
      `Unknown duration variant: ${input.variantLabel}`,
      HttpStatus.BAD_REQUEST
    );
  }
  const duration =
    input.fulfillmentMode === 'parallel'
      ? (variant?.parallelDuration ?? service.parallelDuration)
      : (variant?.duration ?? service.duration);
  if (duration == null)
    throw new HttpException('Fulfillment mode not supported', HttpStatus.BAD_REQUEST);
  // 15-min grid alignment (50 min -> 60 min): otherwise SlotValidator rejects
  // every slot with "15-minute boundaries".
  return Math.ceil(duration / 15) * 15;
}

export function dayWindow(
  opening: OpeningHours,
  dayOfWeek: number
): { start: number; end: number } | null {
  const dayHours = opening.days.find((d) => d.dayOfWeek === dayOfWeek);
  if (!dayHours || dayHours.closed || !dayHours.open || !dayHours.close) return null;
  return { start: toMinutes(dayHours.open), end: toMinutes(dayHours.close) };
}
