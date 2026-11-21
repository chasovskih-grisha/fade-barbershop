import type {
  BarberShiftAvailability,
  DemandOverlay,
  OpenShift,
  ShiftBid,
  ShiftConflict,
} from './shift-bidding-types';
import { DEFAULT_MIN_REST_MINUTES } from './shift-bidding-constants';

export interface Candidate {
  availability: BarberShiftAvailability;
  score: number;
}

export interface AssignmentState {
  availabilities: BarberShiftAvailability[];
  assignedShifts: Map<string, string[]>;
  lastShiftEnd: Map<string, number>;
  consecutiveDays: Map<string, number>;
  referenceShiftStart: number;
}

export interface Allocation {
  state: AssignmentState;
  conflicts: ShiftConflict[];
  barberBids: Map<string, ShiftBid[]>;
  demandOverlay: DemandOverlay | null;
}

export function createAllocation(
  availabilities: BarberShiftAvailability[],
  openShifts: OpenShift[],
  demandOverlay?: DemandOverlay | null
): Allocation {
  const firstOpenShift = openShifts.find((shift) => shift.status === 'open');
  const referenceShiftStart = firstOpenShift?.start.getTime() ?? Date.now();
  const state: AssignmentState = {
    availabilities,
    assignedShifts: new Map(),
    lastShiftEnd: new Map(),
    consecutiveDays: new Map(),
    referenceShiftStart,
  };

  for (const availability of availabilities) {
    state.assignedShifts.set(availability.barberId, []);
    state.lastShiftEnd.set(
      availability.barberId,
      referenceShiftStart - DEFAULT_MIN_REST_MINUTES * 60_000
    );
    state.consecutiveDays.set(availability.barberId, 0);
  }

  return { state, conflicts: [], barberBids: new Map(), demandOverlay: demandOverlay ?? null };
}
