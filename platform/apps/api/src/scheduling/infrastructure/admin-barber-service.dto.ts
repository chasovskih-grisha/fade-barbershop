// DTO + IO token for admin management of the barber x service x location matrix
// (T-4521) and per-location slot policy (T-4522). Factories live in
// admin-barber-service.io.ts, providers in admin-barber-service.providers.ts
// (gate max-lines).

import { HttpException, HttpStatus } from '@nestjs/common';

export const ADMIN_BARBER_SERVICE_IO = Symbol('ADMIN_BARBER_SERVICE_IO');

export interface AdminBarberServiceDeps {
  listForBarberAndLocation(
    barberId: string,
    locationId: string
  ): Promise<BarberServiceAssignmentForBarberDto>;
  listForServiceAndLocation(
    locationId: string,
    serviceId: string
  ): Promise<BarberServiceAssignmentsForLocationDto>;
  setAssignment(input: {
    barberId: string;
    locationId: string;
    serviceId: string;
    active: boolean;
  }): Promise<{ id: string }>;
  getSlotPolicy(locationId: string): Promise<SlotPolicyDto>;
  saveSlotPolicy(locationId: string, dto: UpdateSlotPolicyDto): Promise<SlotPolicyDto>;
}

// ---------- matrix ----------

export type BarberServiceAssignmentForBarberDto = {
  barberId: string;
  locationId: string;
  services: { serviceId: string; active: boolean }[];
};

export type BarberServiceAssignmentsForLocationDto = {
  locationId: string;
  serviceId: string;
  barbers: { barberId: string; active: boolean }[];
};

export type CreateOrActivateAssignmentDto = {
  barberId: string;
  locationId: string;
  serviceId: string;
};

// ---------- slot policy ----------

/** Default policy values (T-4522.Done(1), T-4488). */
export const SLOT_POLICY_DEFAULTS = {
  stepMinutes: 15,
  bufferMinutes: 0,
  horizonDays: 14,
  lastMinuteMinutes: 60,
  timeZone: 'Europe/Kyiv',
} as const;

export type SlotPolicyDto = {
  locationId: string;
  stepMinutes: number;
  bufferMinutes: number;
  horizonDays: number;
  lastMinuteMinutes: number;
  timeZone: string;
  /** true when no policy row exists in DB yet (defaults are used). */
  usingDefaults: boolean;
};

export type UpdateSlotPolicyDto = {
  stepMinutes?: number;
  bufferMinutes?: number;
  horizonDays?: number;
  lastMinuteMinutes?: number;
  timeZone?: string;
};

/**
 * Range validation (T-4522.Done: "range validation"). step must be a multiple
 * of 15: booking persistence requires 15-minute boundaries (SlotValidator),
 * so the grid step has to keep that grid.
 */
export const SLOT_POLICY_RANGES: Record<
  Exclude<keyof typeof SLOT_POLICY_DEFAULTS, 'timeZone'>,
  { min: number; max: number; multipleOf?: number }
> = {
  stepMinutes: { min: 15, max: 60, multipleOf: 15 },
  bufferMinutes: { min: 0, max: 120 },
  horizonDays: { min: 1, max: 365 },
  lastMinuteMinutes: { min: 0, max: 1440 },
};

function assertPolicyRange(field: keyof typeof SLOT_POLICY_RANGES, value: number): void {
  const range = SLOT_POLICY_RANGES[field];
  const outOfRange = !Number.isInteger(value) || value < range.min || value > range.max;
  const offGrid = range.multipleOf !== undefined && value % range.multipleOf !== 0;
  if (outOfRange || offGrid) {
    const grid = range.multipleOf ? ` (multiple of ${range.multipleOf})` : '';
    throw new HttpException(
      `${field} must be an integer in [${range.min}, ${range.max}]${grid}`,
      HttpStatus.BAD_REQUEST
    );
  }
}

function assertTimeZone(timeZone?: string): void {
  if (timeZone === undefined) return;
  try {
    new Intl.DateTimeFormat(undefined, { timeZone });
  } catch {
    throw new HttpException(`Invalid IANA timeZone: ${timeZone}`, HttpStatus.BAD_REQUEST);
  }
}

/** Validates every provided field; throws 400 outside the range. */
export function assertPolicyValues(dto: UpdateSlotPolicyDto): void {
  (Object.keys(SLOT_POLICY_RANGES) as (keyof typeof SLOT_POLICY_RANGES)[]).forEach((field) => {
    const value = dto[field];
    if (value !== undefined) assertPolicyRange(field, value);
  });
  assertTimeZone(dto.timeZone);
}
