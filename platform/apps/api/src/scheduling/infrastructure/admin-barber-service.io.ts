// Thin use-case factories for the admin matrix IO (T-4521) and slot policy
// (T-4522). Split from admin-barber-service.dto.ts (gate max-lines).

import type { BarberServiceAssignmentRepository } from '../domain/ports.barber-service-assignment';
import type { SlotPolicyRepository, SlotPolicyRow } from '../domain/ports.slot-policy';
import { SLOT_POLICY_DEFAULTS, assertPolicyValues, type BarberServiceAssignmentForBarberDto, type BarberServiceAssignmentsForLocationDto, type SlotPolicyDto, type UpdateSlotPolicyDto } from './admin-barber-service.dto';

// ---------- matrix ----------

export function listForBarberAndLocation(assignmentRepo: BarberServiceAssignmentRepository) {
  return async (
    barberId: string,
    locationId: string
  ): Promise<BarberServiceAssignmentForBarberDto> => {
    const snapshot = await assignmentRepo.snapshotForLocation(locationId);
    const byBarber = snapshot.matrix.get(barberId);
    const services = byBarber
      ? Array.from(byBarber.get(locationId) ?? new Set<string>()).map((serviceId) => ({
          serviceId,
          active: true,
        }))
      : [];
    return { barberId, locationId, services };
  };
}

export function listForServiceAndLocation(assignmentRepo: BarberServiceAssignmentRepository) {
  return async (
    locationId: string,
    serviceId: string
  ): Promise<BarberServiceAssignmentsForLocationDto> => {
    const snapshot = await assignmentRepo.snapshotForLocation(locationId);
    const barbers: { barberId: string; active: boolean }[] = [];
    for (const [barberId, byLocation] of snapshot.matrix) {
      const services = byLocation.get(locationId);
      if (services?.has(serviceId)) {
        barbers.push({ barberId, active: true });
      }
    }
    return { locationId, serviceId, barbers };
  };
}

export function setAssignment(assignmentRepo: BarberServiceAssignmentRepository) {
  return async (input: {
    barberId: string;
    locationId: string;
    serviceId: string;
    active: boolean;
  }): Promise<{ id: string }> => {
    await assignmentRepo.setAssignment(input);
    return {
      id: input.barberId + '::' + input.locationId + '::' + input.serviceId,
    };
  };
}

// ---------- slot policy ----------

export function getSlotPolicy(slotPolicyRepo: SlotPolicyRepository) {
  return async (locationId: string): Promise<SlotPolicyDto> => {
    const row = await slotPolicyRepo.forLocation(locationId);
    if (!row) {
      return { ...SLOT_POLICY_DEFAULTS, locationId, usingDefaults: true };
    }
    return {
      locationId,
      stepMinutes: row.stepMinutes,
      bufferMinutes: row.bufferMinutes,
      horizonDays: row.horizonDays,
      lastMinuteMinutes: row.lastMinuteMinutes,
      timeZone: row.timeZone,
      usingDefaults: false,
    };
  };
}

const POLICY_NUMERIC_FIELDS = ['stepMinutes', 'bufferMinutes', 'horizonDays', 'lastMinuteMinutes'] as const;

/** dto overrides existing overrides defaults - a partial update is a full row. */
function mergePolicyValues(
  dto: UpdateSlotPolicyDto,
  existing: SlotPolicyRow | null
): {
  stepMinutes: number;
  bufferMinutes: number;
  horizonDays: number;
  lastMinuteMinutes: number;
  timeZone: string;
} {
  const mergedNum = {} as Record<(typeof POLICY_NUMERIC_FIELDS)[number], number>;
  for (const field of POLICY_NUMERIC_FIELDS) {
    mergedNum[field] = dto[field] ?? existing?.[field] ?? SLOT_POLICY_DEFAULTS[field];
  }
  const timeZone = dto.timeZone ?? existing?.timeZone ?? SLOT_POLICY_DEFAULTS.timeZone;
  return { ...mergedNum, timeZone };
}

export function saveSlotPolicy(slotPolicyRepo: SlotPolicyRepository) {
  return async (locationId: string, dto: UpdateSlotPolicyDto): Promise<SlotPolicyDto> => {
    // Range validation (T-4522): provided fields only, 400 out of range.
    assertPolicyValues(dto);
    const existing = await slotPolicyRepo.forLocation(locationId);
    const values = mergePolicyValues(dto, existing);
    await slotPolicyRepo.save({
      id: existing?.id ?? 'policy::' + locationId,
      locationId,
      ...values,
    });
    return { ...values, locationId, usingDefaults: false };
  };
}
