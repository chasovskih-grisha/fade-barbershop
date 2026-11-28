/** Типи мапи залу, посадки клієнтів і зведення по залу (T-5029). */

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
