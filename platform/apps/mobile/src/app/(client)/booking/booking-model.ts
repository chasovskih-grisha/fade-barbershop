import type { BarberDto } from '../../../lib/api/barbers';
import type { LocationDto } from '../../../lib/api/locations';
import type { ServiceDto } from '../../../lib/api/catalog';

export const BOOKING_STEPS = [
  'location',
  'services',
  'barbers',
  'slots',
  'confirm',
  'done',
] as const;
export type BookingStep = (typeof BOOKING_STEPS)[number];

export interface BookingSlot {
  start: Date;
  end: Date;
}

export function nextStep(step: BookingStep): BookingStep {
  const index = BOOKING_STEPS.indexOf(step);
  return BOOKING_STEPS[Math.min(index + 1, BOOKING_STEPS.length - 1)] ?? step;
}

export function previousStep(step: BookingStep): BookingStep {
  const index = BOOKING_STEPS.indexOf(step);
  return BOOKING_STEPS[Math.max(index - 1, 0)] ?? step;
}

export function buildSlots(durationMinutes: number): BookingSlot[] {
  const start = new Date(Date.now() + 30 * 60_000);
  return Array.from({ length: 4 }, (_, index) => {
    const slotStart = new Date(start.getTime() + index * 60 * 60_000);
    return {
      start: slotStart,
      end: new Date(slotStart.getTime() + Math.max(durationMinutes, 30) * 60_000),
    };
  });
}

export function serviceNames(services: ServiceDto[], ids: string[]): string {
  return ids
    .map((id) => services.find((service) => service.id === id)?.name)
    .filter((name): name is string => Boolean(name))
    .join(', ');
}

export function selectedDuration(services: ServiceDto[], ids: string[]): number {
  return ids.reduce(
    (total, id) => total + (services.find((service) => service.id === id)?.durationMinutes ?? 0),
    0
  );
}

export type { BarberDto, LocationDto, ServiceDto };
