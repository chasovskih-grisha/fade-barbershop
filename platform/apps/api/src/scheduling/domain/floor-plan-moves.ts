/** Посадка, переміщення, звільнення крісла і зведення по залу (T-5029). */
import { findSeat, updateSeat } from './floor-plan-helpers';
import type { FloorPlanResult, FloorPlanState } from './floor-plan.types';

/** Seats a client at a specific free chair for a barber. */
export function seatClient(
  state: FloorPlanState,
  input: { seatId: string; barberId: string; clientId: string; nowMs: number }
): FloorPlanResult {
  const seat = findSeat(state, input.seatId);
  if (!seat) return { ok: false, reason: 'seat_not_found' };
  if (seat.status !== 'free') return { ok: false, reason: 'seat_unavailable' };
  if (state.assignments.some((assignment) => assignment.barberId === input.barberId)) {
    return { ok: false, reason: 'barber_busy' };
  }
  if (state.assignments.some((assignment) => assignment.clientId === input.clientId)) {
    return { ok: false, reason: 'client_already_seated' };
  }
  return {
    ok: true,
    state: {
      seats: updateSeat(state, input.seatId, 'occupied'),
      assignments: [
        ...state.assignments,
        {
          seatId: input.seatId,
          barberId: input.barberId,
          clientId: input.clientId,
          startedAtMs: input.nowMs,
        },
      ],
      waitingClientIds: state.waitingClientIds.filter((id) => id !== input.clientId),
      revision: state.revision + 1,
    },
  };
}

/** Drag-and-drop move between chairs; the target must be free and the source occupied. */
export function moveClient(
  state: FloorPlanState,
  input: { fromSeatId: string; toSeatId: string }
): FloorPlanResult {
  if (input.fromSeatId === input.toSeatId) return { ok: true, state };
  const from = findSeat(state, input.fromSeatId);
  const to = findSeat(state, input.toSeatId);
  if (!from || !to) return { ok: false, reason: 'seat_not_found' };
  if (to.status !== 'free') return { ok: false, reason: 'target_occupied' };
  if (!state.assignments.some((assignment) => assignment.seatId === input.fromSeatId)) {
    return { ok: false, reason: 'seat_unavailable' };
  }
  return {
    ok: true,
    state: {
      seats: state.seats.map((seat) => {
        if (seat.id === input.fromSeatId) return { ...seat, status: 'free' };
        if (seat.id === input.toSeatId) return { ...seat, status: 'occupied' };
        return seat;
      }),
      assignments: state.assignments.map((assignment) =>
        assignment.seatId === input.fromSeatId
          ? { ...assignment, seatId: input.toSeatId }
          : assignment
      ),
      waitingClientIds: state.waitingClientIds,
      revision: state.revision + 1,
    },
  };
}

/** Seats the first waiting client in the first free chair (queue balancing). */
export function seatNextFromLounge(
  state: FloorPlanState,
  input: { barberId: string; nowMs: number }
): FloorPlanResult {
  const clientId = state.waitingClientIds[0];
  if (!clientId) return { ok: false, reason: 'no_client_waiting' };
  const freeSeat = state.seats.find((candidate) => candidate.status === 'free');
  if (!freeSeat) return { ok: false, reason: 'no_free_seat' };
  return seatClient(state, {
    seatId: freeSeat.id,
    barberId: input.barberId,
    clientId,
    nowMs: input.nowMs,
  });
}

