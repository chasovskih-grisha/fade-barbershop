/** Стани залу для спеків посадки (T-5029). */
import {
  addWaitingClient,
  createFloorPlan,
  seatClient,
  type FloorPlanState,
} from './floor-plan-seat-matrix';

export const NOW = new Date('2026-11-22T12:00:00Z').getTime();

export function plan(): FloorPlanState {
  const created = createFloorPlan([
    { id: 'chair-1', col: 1, row: 1, status: 'free' },
    { id: 'chair-2', col: 2, row: 1, status: 'free' },
    { id: 'chair-3', col: 1, row: 2, status: 'cleaning' },
  ]);
  if (!created.ok) throw new Error(created.reason);
  return created.state;
}

export function seated(): FloorPlanState {
  const first = seatClient(addWaitingClient(plan(), 'client-1'), {
    seatId: 'chair-1',
    barberId: 'barber-1',
    clientId: 'client-1',
    nowMs: NOW,
  });
  if (!first.ok) throw new Error(first.reason);
  return first.state;
}
