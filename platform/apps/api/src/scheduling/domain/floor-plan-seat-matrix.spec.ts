import {
  addWaitingClient,
  createFloorPlan,
  moveClient,
  releaseSeat,
  seatClient,
  seatNextFromLounge,
  summarizeFloor,
  type FloorPlanState,
} from './floor-plan-seat-matrix';

const NOW = new Date('2026-11-22T12:00:00Z').getTime();

function plan(): FloorPlanState {
  const created = createFloorPlan([
    { id: 'chair-1', col: 1, row: 1, status: 'free' },
    { id: 'chair-2', col: 2, row: 1, status: 'free' },
    { id: 'chair-3', col: 1, row: 2, status: 'cleaning' },
  ]);
  if (!created.ok) throw new Error(created.reason);
  return created.state;
}

function seated(): FloorPlanState {
  const first = seatClient(addWaitingClient(plan(), 'client-1'), {
    seatId: 'chair-1',
    barberId: 'barber-1',
    clientId: 'client-1',
    nowMs: NOW,
  });
  if (!first.ok) throw new Error(first.reason);
  return first.state;
}

describe('floor plan seat matrix (T-5029)', () => {
  it('rejects duplicate seats and stacked positions', () => {
    const base = { col: 1, row: 1, status: 'free' as const };
    expect(createFloorPlan([{ ...base, id: 'a' }, { ...base, id: 'a' }]).ok).toBe(false);
    expect(createFloorPlan([{ ...base, id: 'a' }, { ...base, id: 'b' }])).toEqual({
      ok: false,
      reason: 'duplicate_position',
    });
  });

  it('seats a waiting client and marks the chair occupied', () => {
    const state = seated();
    expect(state.seats.find((seat) => seat.id === 'chair-1')?.status).toBe('occupied');
    expect(state.waitingClientIds).toEqual([]);
    expect(state.assignments).toEqual([
      { seatId: 'chair-1', barberId: 'barber-1', clientId: 'client-1', startedAtMs: NOW },
    ]);
    expect(state.revision).toBeGreaterThan(1);
  });

  it('prevents double seating, busy barbers and unavailable chairs', () => {
    const state = seated();
    expect(
      seatClient(state, { seatId: 'chair-2', barberId: 'barber-1', clientId: 'client-2', nowMs: NOW })
    ).toEqual({ ok: false, reason: 'barber_busy' });
    expect(
      seatClient(state, { seatId: 'chair-1', barberId: 'barber-2', clientId: 'client-3', nowMs: NOW })
    ).toEqual({ ok: false, reason: 'seat_unavailable' });
    expect(
      seatClient(state, { seatId: 'chair-3', barberId: 'barber-2', clientId: 'client-3', nowMs: NOW })
    ).toEqual({ ok: false, reason: 'seat_unavailable' });
  });

  it('moves a client to a free chair and refuses an occupied target', () => {
    const moved = moveClient(seated(), { fromSeatId: 'chair-1', toSeatId: 'chair-2' });
    expect(moved.ok).toBe(true);
    if (!moved.ok) return;
    expect(moved.state.assignments[0]?.seatId).toBe('chair-2');
    expect(moved.state.seats.find((seat) => seat.id === 'chair-1')?.status).toBe('free');
    expect(moveClient(moved.state, { fromSeatId: 'chair-2', toSeatId: 'chair-2' }).ok).toBe(true);
    expect(
      moveClient(seated(), { fromSeatId: 'chair-1', toSeatId: 'chair-3' })
    ).toEqual({ ok: false, reason: 'target_occupied' });
  });

  it('releases a chair into sanitization', () => {
    const released = releaseSeat(seated(), { seatId: 'chair-1', nextStatus: 'cleaning' });
    expect(released.ok).toBe(true);
    if (!released.ok) return;
    expect(released.state.assignments).toEqual([]);
    expect(released.state.seats.find((seat) => seat.id === 'chair-1')?.status).toBe('cleaning');
    expect(releaseSeat(released.state, { seatId: 'chair-1' })).toEqual({
      ok: false,
      reason: 'seat_unavailable',
    });
  });

  it('seats the first waiting client in the first free chair and summarizes the floor', () => {
    const queued = addWaitingClient(addWaitingClient(plan(), 'client-1'), 'client-2');
    const seatedNext = seatNextFromLounge(queued, { barberId: 'barber-1', nowMs: NOW });
    expect(seatedNext.ok).toBe(true);
    if (!seatedNext.ok) return;
    expect(seatedNext.state.assignments[0]?.clientId).toBe('client-1');
    expect(seatedNext.state.waitingClientIds).toEqual(['client-2']);

    expect(summarizeFloor(seatedNext.state)).toEqual({
      totalSeats: 3,
      occupied: 1,
      free: 1,
      cleaning: 1,
      waiting: 1,
      occupancyRate: 0.5,
    });
    expect(seatNextFromLounge(plan(), { barberId: 'barber-1', nowMs: NOW })).toEqual({
      ok: false,
      reason: 'no_client_waiting',
    });
  });
});
