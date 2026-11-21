// Slot policy snapshot for slot generation (T-4522): per-location step/buffer/
// horizon/last-minute. Split from available-slots-helpers.ts (gate max-lines).

import type { SlotPolicyRow } from '../../scheduling/domain/ports.slot-policy';

export interface SlotPolicySnapshot {
  stepMinutes: number;
  bufferMinutes: number;
  horizonDays: number;
  lastMinuteMinutes: number;
  timeZone: string;
}

/**
 * Snapshot from storage or defaults (T-4522.Done(1), T-4488).
 * Defaults: step 15, buffer 0, horizon 14 days, last-minute 60, timeZone Europe/Kyiv.
 */
export function readSlotPolicySnapshot(policy: SlotPolicyRow | null): SlotPolicySnapshot {
  if (!policy) {
    return {
      stepMinutes: 15,
      bufferMinutes: 0,
      horizonDays: 14,
      lastMinuteMinutes: 60,
      timeZone: 'Europe/Kyiv',
    };
  }
  let tz = policy.timeZone || 'Europe/Kyiv';
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
  } catch {
    tz = 'Europe/Kyiv';
  }
  return {
    stepMinutes: policy.stepMinutes,
    bufferMinutes: policy.bufferMinutes,
    horizonDays: policy.horizonDays,
    lastMinuteMinutes: policy.lastMinuteMinutes,
    timeZone: tz,
  };
}

/**
 * Booking horizon (T-4522): a requested date outside
 * [today, today + horizonDays] (UTC booking day) gets no slots.
 * Past dates are not cut here - the caller skips cutoffs for them.
 */
export function isBeyondHorizon(requestedDate: Date, now: Date, horizonDays: number): boolean {
  const todayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return requestedDate.getTime() > todayStart + horizonDays * 86_400_000;
}

/**
 * Last-minute cutoff (T-4522): a slot is closed for booking when it starts
 * closer than `lastMinuteMinutes` to now (past slots are closed too).
 */
export function isClosedByLastMinute(startAt: Date, now: Date, lastMinuteMinutes: number): boolean {
  return startAt.getTime() - now.getTime() < lastMinuteMinutes * 60_000;
}
