/** Multi-shop floor plan, seat matrix and walk-in assignment (T-5029). */

export type SeatStatus = 'free' | 'occupied' | 'cleaning';

export interface FloorSeat {
  readonly id: string;
  readonly col: number;
  readonly row: number;
  readonly status: SeatStatus;
}

export interface SeatAssignment {
  readonly seatId: string;
  readonly barberId: string;
  readonly clientId: string;
  readonly startedAtMs: number;
}

export interface FloorPlanState {
  readonly seats: readonly FloorSeat[];
  readonly assignments: readonly SeatAssignment[];
  readonly waitingClientIds: readonly string[];
  readonly revision: number;
}

export type FloorPlanFailure =
  | 'seat_not_found'
  | 'seat_unavailable'
  | 'barber_busy'
  | 'client_already_seated'
  | 'target_occupied'
  | 'no_client_waiting'
  | 'no_free_seat'
  | 'duplicate_seat'
  | 'duplicate_position';

export type FloorPlanResult =
  | { readonly ok: true; readonly state: FloorPlanState }
  | { readonly ok: false; readonly reason: FloorPlanFailure };

export interface FloorSummary {
  readonly totalSeats: number;
  readonly occupied: number;
  readonly free: number;
  readonly cleaning: number;
  readonly waiting: number;
  readonly occupancyRate: number;
}

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
  return { ok: true, state: { seats: [...seats], assignments: [], waitingClientIds: [], revision: 1 } };
}

export function addWaitingClient(state: FloorPlanState, clientId: string): FloorPlanState {
  if (state.waitingClientIds.includes(clientId)) return state;
  return { ...state, waitingClientIds: [...state.waitingClientIds, clientId], revision: state.revision + 1 };
}

function findSeat(state: FloorPlanState, seatId: string): FloorSeat | undefined {
  return state.seats.find((seat) => seat.id === seatId);
}

function updateSeat(state: FloorPlanState, seatId: string, status: SeatStatus): readonly FloorSeat[] {
  return state.seats.map((seat) => (seat.id === seatId ? { ...seat, status } : seat));
}

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
        { seatId: input.seatId, barberId: input.barberId, clientId: input.clientId, startedAtMs: input.nowMs },
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
        assignment.seatId === input.fromSeatId ? { ...assignment, seatId: input.toSeatId } : assignment
      ),
      waitingClientIds: state.waitingClientIds,
      revision: state.revision + 1,
    },
  };
}

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

/** Seats the first waiting client in the first free chair (queue balancing). */
export function seatNextFromLounge(
  state: FloorPlanState,
  input: { barberId: string; nowMs: number }
): FloorPlanResult {
  const clientId = state.waitingClientIds[0];
  if (!clientId) return { ok: false, reason: 'no_client_waiting' };
  const freeSeat = state.seats.find((seat) => seat.status === 'free');
  if (!freeSeat) return { ok: false, reason: 'no_free_seat' };
  return seatClient(state, {
    seatId: freeSeat.id,
    barberId: input.barberId,
    clientId,
    nowMs: input.nowMs,
  });
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
