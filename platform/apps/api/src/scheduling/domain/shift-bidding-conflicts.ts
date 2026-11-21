import type { OpenShift, ShiftConflict } from './shift-bidding-types';
import type { Allocation, Candidate } from './shift-bidding-allocation';
import { DEFAULT_MAX_CONSECUTIVE_DAYS, DEFAULT_MIN_REST_MINUTES } from './shift-bidding-constants';

export function findConflict(
  shift: OpenShift,
  candidate: Candidate,
  allocation: Allocation
): ShiftConflict | undefined {
  const { barberId, minRestMinutes, maxConsecutiveDays } = candidate.availability;
  const lastShiftEnd =
    allocation.state.lastShiftEnd.get(barberId) ?? allocation.state.referenceShiftStart;
  const restMinutes = Math.max(0, (shift.start.getTime() - lastShiftEnd) / 60_000);
  if (restMinutes < (minRestMinutes ?? DEFAULT_MIN_REST_MINUTES)) {
    return buildConflict({
      id: `rest-${shift.id}-${barberId}`,
      type: 'min_rest_violation',
      message: 'Insufficient rest period',
      shiftId: shift.id,
    });
  }

  const consecutive = allocation.state.consecutiveDays.get(barberId) ?? 0;
  if (consecutive >= (maxConsecutiveDays ?? DEFAULT_MAX_CONSECUTIVE_DAYS)) {
    return buildConflict({
      id: `consecutive-${shift.id}-${barberId}`,
      type: 'max_hours_exceeded',
      message: 'Maximum consecutive days exceeded',
      shiftId: shift.id,
    });
  }

  const preferredSkill = allocation.demandOverlay?.preferredSkillLevel;
  if (shift.requiredSkillLevel && preferredSkill && preferredSkill !== shift.requiredSkillLevel) {
    return buildConflict({
      id: `skill-${shift.id}-${barberId}`,
      type: 'skill_mismatch',
      message: 'Skill level mismatch',
      shiftId: shift.id,
    });
  }

  return undefined;
}

function buildConflict(input: {
  id: string;
  type: ShiftConflict['type'];
  message: string;
  shiftId: string;
}): ShiftConflict {
  return {
    id: input.id,
    type: input.type,
    message: input.message,
    affectedShifts: [input.shiftId],
  };
}
