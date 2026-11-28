/** Multi-shop floor plan, seat matrix and walk-in assignment (T-5029).
 *
 * Публічний шлях модуля: типи й операції з кріслами живуть у floor-plan.types.ts,
 * floor-plan-moves.ts і floor-plan-helpers.ts, але імпорт із цього файлу лишається
 * робочим для викликів і спеків.
 */
import type { FloorPlanResult, FloorPlanState, FloorSeat } from './floor-plan.types';

export type {
  FloorPlanFailure,
  FloorPlanResult,
  FloorPlanState,
  FloorSeat,
  FloorSummary,
  SeatAssignment,
  SeatStatus,
} from './floor-plan.types';
export { moveClient, seatClient, seatNextFromLounge } from './floor-plan-moves';
export { releaseSeat, summarizeFloor } from './floor-plan-release';

/** Builds a floor plan, rejecting duplicate ids and stacked seats. */
export function createFloorPlan(seats: readonly FloorSeat[]): FloorPlanResult {
  const ids = new Set<string>();
  const positions = new Set<string>();
  for (const seat of seats) {
    if (ids.has(seat.id)) return { ok: false, reason: 'duplicate_seat' };
    const position = `${seat.col}:${seat.row}`;
    if (positions.has(position)) return { ok: false, reason: 'duplicate_position' };
    ids.add(seat.id);
    positions.add(position);
  }
  return {
    ok: true,
    state: { seats: [...seats], assignments: [], waitingClientIds: [], revision: 1 },
  };
}

export function addWaitingClient(state: FloorPlanState, clientId: string): FloorPlanState {
  if (state.waitingClientIds.includes(clientId)) return state;
  return {
    ...state,
    waitingClientIds: [...state.waitingClientIds, clientId],
    revision: state.revision + 1,
  };
}
