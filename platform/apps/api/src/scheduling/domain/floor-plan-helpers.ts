/** Спільні операції над місцями мапи залу (T-5029). */
import type { FloorPlanState, FloorSeat, SeatStatus } from './floor-plan.types';

export function findSeat(state: FloorPlanState, seatId: string): FloorSeat | undefined {
  return state.seats.find((seat) => seat.id === seatId);
}

export function updateSeat(
  state: FloorPlanState,
  seatId: string,
  status: SeatStatus
): readonly FloorSeat[] {
  return state.seats.map((seat) => (seat.id === seatId ? { ...seat, status } : seat));
}
