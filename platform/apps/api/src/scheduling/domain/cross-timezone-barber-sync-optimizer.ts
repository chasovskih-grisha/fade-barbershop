/* eslint-disable max-lines -- cohesive module (118 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
import { getZonedOffsetMinutes, isDstTransitionSafe } from './time-utils';

export interface TimezoneSlotRequest {
  slotId: string;
  barberId: string;
  clientId: string;
  clientTimezone: string; // e.g., 'Europe/Kyiv', 'Europe/London', 'America/New_York'
  salonTimezone: string; // e.g., 'Europe/Kyiv'
  startUtc: Date;
  durationMinutes: number;
  sanitationBufferMinutes: number;
}

export interface BarberExistingAssignment {
  barberId: string;
  startUtc: Date;
  endUtc: Date;
}

export interface CrossTimezoneSyncConfig {
  maxAllowedTimezoneDriftMinutes: number;
  defaultBufferMinutes: number;
  dstSafetyMarginMinutes: number;
}

export const DEFAULT_CROSS_TIMEZONE_SYNC_CONFIG: CrossTimezoneSyncConfig = {
  maxAllowedTimezoneDriftMinutes: 1440, // 24 hours max
  defaultBufferMinutes: 10,
  dstSafetyMarginMinutes: 15,
};

export interface CrossTimezoneSyncResult {
  isSynchronized: boolean;
  normalizedStartUtc: Date;
  normalizedEndUtc: Date;
  requiredBufferMinutes: number;
  dstAdjustedBufferMinutes: number;
  timezoneDriftMinutes: number;
  dstSafe: boolean;
  dstTransitionDetected: boolean;
  conflictBarberId?: string;
  reason: string;
}

/**
 * Evaluates and synchronizes slot requests across timezones and checks multi-barber calendar overlaps with sanitation buffer,
 * timezone drift limits, and DST transition safety with automated buffer adjustment.
 */
export function evaluateCrossTimezoneBarberSync(
  request: TimezoneSlotRequest,
  existingAssignments: BarberExistingAssignment[],
  config: CrossTimezoneSyncConfig = DEFAULT_CROSS_TIMEZONE_SYNC_CONFIG
): CrossTimezoneSyncResult {
  const startMs = request.startUtc.getTime();
  const durationMs = request.durationMinutes * 60 * 1000;
  const baseBufferMinutes = Math.max(request.sanitationBufferMinutes, config.defaultBufferMinutes);

  const endMs = startMs + durationMs;

  const normalizedStartUtc = new Date(startMs);
  const normalizedEndUtc = new Date(endMs);

  const clientOffset = getZonedOffsetMinutes(normalizedStartUtc, request.clientTimezone);
  const salonOffset = getZonedOffsetMinutes(normalizedStartUtc, request.salonTimezone);
  const timezoneDriftMinutes = Math.abs(clientOffset - salonOffset);

  if (timezoneDriftMinutes > config.maxAllowedTimezoneDriftMinutes) {
    return {
      isSynchronized: false,
      normalizedStartUtc,
      normalizedEndUtc,
      requiredBufferMinutes: baseBufferMinutes,
      dstAdjustedBufferMinutes: baseBufferMinutes,
      timezoneDriftMinutes,
      dstSafe: true,
      dstTransitionDetected: false,
      reason: `Timezone drift between client (${request.clientTimezone}) and salon (${request.salonTimezone}) is ${timezoneDriftMinutes} minutes, exceeding max allowed ${config.maxAllowedTimezoneDriftMinutes} minutes.`,
    };
  }

  const salonDstSafe = isDstTransitionSafe(
    normalizedStartUtc,
    normalizedEndUtc,
    request.salonTimezone
  );
  const clientDstSafe = isDstTransitionSafe(
    normalizedStartUtc,
    normalizedEndUtc,
    request.clientTimezone
  );
  const dstTransitionDetected = !salonDstSafe || !clientDstSafe;
  const dstSafe = !dstTransitionDetected;

  const dstAdjustedBufferMinutes = dstTransitionDetected
    ? baseBufferMinutes + config.dstSafetyMarginMinutes
    : baseBufferMinutes;
  const bufferMs = dstAdjustedBufferMinutes * 60 * 1000;

  // Check if requested barber has overlapping assignments
  const barberAssignments = existingAssignments.filter((a) => a.barberId === request.barberId);

  for (const assignment of barberAssignments) {
    const assignStart = assignment.startUtc.getTime();
    const assignEnd = assignment.endUtc.getTime();
    const assignBufferedEndMs = assignEnd + bufferMs;

    // Overlap check: if new appointment starts before existing appointment + buffer ends
    if (startMs < assignBufferedEndMs && endMs > assignStart) {
      return {
        isSynchronized: false,
        normalizedStartUtc,
        normalizedEndUtc,
        requiredBufferMinutes: baseBufferMinutes,
        dstAdjustedBufferMinutes,
        timezoneDriftMinutes,
        dstSafe,
        dstTransitionDetected,
        conflictBarberId: request.barberId,
        reason: `Barber ${request.barberId} has an overlapping appointment or required buffer conflict between ${assignment.startUtc.toISOString()} and ${assignment.endUtc.toISOString()}.`,
      };
    }
  }

  let reason =
    'Cross-timezone slot request successfully synchronized and verified against barber schedule, timezone drift limits, and DST safety.';
  if (dstTransitionDetected) {
    reason = `DST transition detected during slot interval. Automated safety margin of ${config.dstSafetyMarginMinutes}m applied, adjusting total buffer to ${dstAdjustedBufferMinutes}m.`;
  }

  return {
    isSynchronized: true,
    normalizedStartUtc,
    normalizedEndUtc,
    requiredBufferMinutes: baseBufferMinutes,
    dstAdjustedBufferMinutes,
    timezoneDriftMinutes,
    dstSafe,
    dstTransitionDetected,
    reason,
  };
}
