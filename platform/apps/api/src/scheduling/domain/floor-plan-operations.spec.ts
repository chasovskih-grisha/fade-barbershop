import {
  addWaitingClient,
  moveClient,
  releaseSeat,
  seatNextFromLounge,
  summarizeFloor,
} from './floor-plan-seat-matrix';
import { NOW, plan, seated } from './floor-plan-test.fakes';

describe('floor plan operations (T-5029)', () => {
  it('moves a client to a free chair and refuses an occupied target', () => {
    const moved = moveClient(seated(), { fromSeatId: 'chair-1', toSeatId: 'chair-2' });
    expect(moved.ok).toBe(true);
    if (!moved.ok) return;
    expect(moved.state.assignments[0]?.seatId).toBe('chair-2');
    expect(moved.state.seats.find((seat) => seat.id === 'chair-1')?.status).toBe('free');
    expect(moveClient(moved.state, { fromSeatId: 'chair-2', toSeatId: 'chair-2' }).ok).toBe(true);
    expect(moveClient(seated(), { fromSeatId: 'chair-1', toSeatId: 'chair-3' })).toEqual({
      ok: false,
      reason: 'target_occupied',
    });
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
