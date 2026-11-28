import { createFloorPlan, seatClient } from './floor-plan-seat-matrix';
import { NOW, seated } from './floor-plan-test.fakes';

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
});
