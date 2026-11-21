import type { BarberShiftAvailability, DemandOverlay, OpenShift } from './shift-bidding-types';
import { DEFAULT_MIN_REST_MINUTES } from './shift-bidding-constants';

/** State of a barber at the moment a shift is scored. */
export interface EligibilityContext {
  lastShiftEnd: number;
  demandOverlay?: DemandOverlay | null;
}

/**
 * Calculates eligibility score for a barber for a given shift.
 * Higher score = more eligible.
 */
export function calculateEligibilityScore(
  shift: OpenShift,
  availability: BarberShiftAvailability,
  context: EligibilityContext
): number {
  const shiftHour = shift.start.getHours();
  let score = scoreHourRanges(shiftHour, availability.preferredShiftRanges, 10);
  score += scoreHourRanges(shiftHour, availability.forbiddenShiftRanges, -20);
  score += scoreRest(shift, availability, context.lastShiftEnd);
  score += scoreWeeklyHours(shift, availability);
  score += scoreDemand(shift, shiftHour, context.demandOverlay);
  return Math.max(0, score);
}

function scoreHourRanges(hour: number, ranges: number[][] | undefined, points: number): number {
  const matches = (ranges ?? []).some(([from, to]) => {
    return from !== undefined && to !== undefined && hour >= from && hour < to;
  });
  return matches ? points : 0;
}

function scoreRest(
  shift: OpenShift,
  availability: BarberShiftAvailability,
  lastShiftEnd: number
): number {
  const minRest = availability.minRestMinutes ?? DEFAULT_MIN_REST_MINUTES;
  const restMinutes = Math.max(0, Math.round((shift.start.getTime() - lastShiftEnd) / 60_000));
  return restMinutes >= minRest ? 5 : 0;
}

function scoreWeeklyHours(shift: OpenShift, availability: BarberShiftAvailability): number {
  const hours = Math.round((shift.end.getTime() - shift.start.getTime()) / 3_600_000);
  const min = availability.minWeeklyHours ?? 0;
  const max = availability.maxWeeklyHours ?? Infinity;
  return hours >= min && hours <= max ? 3 : 0;
}

function scoreDemand(
  shift: OpenShift,
  shiftHour: number,
  demandOverlay?: DemandOverlay | null
): number {
  if (!demandOverlay) return 0;
  let score = demandOverlay.peakHours.includes(shiftHour) ? 8 : 0;
  const preferredSkill = demandOverlay.preferredSkillLevel;
  if (shift.requiredSkillLevel && preferredSkill === shift.requiredSkillLevel) {
    score += 15;
  }
  return score;
}
