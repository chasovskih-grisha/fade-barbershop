import type {
  BarberShiftAvailability,
  DemandOverlay,
  OpenShift,
  ShiftBiddingResult,
} from './shift-bidding-types';
import type { Allocation } from './shift-bidding-allocation';
import { createAllocation } from './shift-bidding-allocation';
import {
  findAssignableCandidate,
  rankCandidates,
  recordAssignment,
} from './shift-bidding-candidates';

/**
 * Optimizes shift bidding and assigns shifts to barbers.
 * Considers availability, rest periods, skill levels, and demand overlay.
 */
export function optimizeShiftBidding(
  openShifts: OpenShift[],
  barberAvailabilities: BarberShiftAvailability[],
  demandOverlay?: DemandOverlay | null
): ShiftBiddingResult {
  const allocation = createAllocation(barberAvailabilities, openShifts, demandOverlay);

  for (const shift of openShifts) {
    if (shift.status !== 'open') continue;
    const candidates = rankCandidates(shift, allocation);
    const chosen = findAssignableCandidate(shift, candidates, allocation);
    if (chosen) recordAssignment(chosen, shift, allocation);
  }

  const assignedShiftIds = new Set([...allocation.state.assignedShifts.values()].flat());
  return {
    openShifts,
    barberBids: allocation.barberBids,
    conflicts: allocation.conflicts,
    recommendedAssignments: buildRecommendedAssignments(allocation, openShifts),
    unresolvedShifts: openShifts.filter((shift) => !assignedShiftIds.has(shift.id)),
  };
}

function buildRecommendedAssignments(
  allocation: Allocation,
  openShifts: OpenShift[]
): Map<string, string[]> {
  const openShiftIds = new Set(openShifts.map((shift) => shift.id));
  const entries: [string, string[]][] = [...allocation.state.assignedShifts].map(
    ([barberId, ids]) => [barberId, ids.filter((id) => openShiftIds.has(id))]
  );
  return new Map(entries);
}
