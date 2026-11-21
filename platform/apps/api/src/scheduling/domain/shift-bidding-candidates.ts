import type { OpenShift, ShiftBid } from './shift-bidding-types';
import type { Allocation, Candidate } from './shift-bidding-allocation';
import { DEFAULT_PROPOSAL_WINDOW_MINUTES } from './shift-bidding-constants';
import { calculateEligibilityScore } from './shift-bidding-eligibility';
import { findConflict } from './shift-bidding-conflicts';

export function rankCandidates(shift: OpenShift, allocation: Allocation): Candidate[] {
  return allocation.state.availabilities
    .map((availability) => ({
      availability,
      score: calculateEligibilityScore(shift, availability, {
        lastShiftEnd:
          allocation.state.lastShiftEnd.get(availability.barberId) ??
          allocation.state.referenceShiftStart,
        demandOverlay: allocation.demandOverlay,
      }),
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function findAssignableCandidate(
  shift: OpenShift,
  candidates: Candidate[],
  allocation: Allocation
): Candidate | undefined {
  for (const candidate of candidates) {
    const conflict = findConflict(shift, candidate, allocation);
    if (conflict) {
      allocation.conflicts.push(conflict);
      continue;
    }
    return candidate;
  }
  return undefined;
}

export function recordAssignment(
  candidate: Candidate,
  shift: OpenShift,
  allocation: Allocation
): void {
  const { barberId } = candidate.availability;
  const assigned = allocation.state.assignedShifts.get(barberId) ?? [];
  allocation.state.assignedShifts.set(barberId, [...assigned, shift.id]);
  allocation.state.lastShiftEnd.set(barberId, shift.end.getTime());
  allocation.state.consecutiveDays.set(
    barberId,
    (allocation.state.consecutiveDays.get(barberId) ?? 0) + 1
  );

  const bid: ShiftBid = {
    id: `bid-${shift.id}-${barberId}`,
    shiftId: shift.id,
    barberId,
    status: 'accepted',
    bidAt: new Date(),
    expiresAt: new Date(shift.start.getTime() + DEFAULT_PROPOSAL_WINDOW_MINUTES * 60_000),
  };
  allocation.barberBids.set(barberId, [...(allocation.barberBids.get(barberId) ?? []), bid]);
}
