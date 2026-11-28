/** Звільнення крісла (за потреби — у санітайзинг) і зведення по залу (T-5029). */
import { findSeat, updateSeat } from './floor-plan-helpers';
import type { FloorPlanResult, FloorPlanState, FloorSummary } from './floor-plan.types';

/** Frees a chair, optionally sending it to sanitization. */
export function releaseSeat(
  state: FloorPlanState,
  input: { seatId: string; nextStatus?: 'free' | 'cleaning' }
): FloorPlanResult {
  const seat = findSeat(state, input.seatId);
  if (!seat) return { ok: false, reason: 'seat_not_found' };
  if (!state.assignments.some((assignment) => assignment.seatId === input.seatId)) {
    return { ok: false, reason: 'seat_unavailable' };
  }
  return {
    ok: true,
    state: {
      seats: updateSeat(state, input.seatId, input.nextStatus ?? 'free'),
      assignments: state.assignments.filter((assignment) => assignment.seatId !== input.seatId),
      waitingClientIds: state.waitingClientIds,
      revision: state.revision + 1,
    },
  };
}

export function summarizeFloor(state: FloorPlanState): FloorSummary {
  const occupied = state.seats.filter((seat) => seat.status === 'occupied').length;
  const free = state.seats.filter((seat) => seat.status === 'free').length;
  const cleaning = state.seats.filter((seat) => seat.status === 'cleaning').length;
  const available = occupied + free;
  return {
    totalSeats: state.seats.length,
    occupied,
    free,
    cleaning,
    waiting: state.waitingClientIds.length,
    occupancyRate: available === 0 ? 0 : occupied / available,
  };
}
