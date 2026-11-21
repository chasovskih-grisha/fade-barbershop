import { DistributedSlotLockingEngine } from '../distributed-lock';

describe('DistributedSlotLockingEngine', () => {
  it('acquires and releases locks correctly', async () => {
    const engine = new DistributedSlotLockingEngine();
    const lock = { barberId: 'barber-123', date: '2026-11-15', slotTime: '10:00' };

    const first = await engine.acquireLock(lock);
    expect(first.acquired).toBe(true);
    expect(first.token).toBeTruthy();

    const contested = await engine.acquireLock({ ...lock, options: { retryCount: 0 } });
    expect(contested.acquired).toBe(false);

    const released = await engine.releaseLock(first.lockKey, first.token);
    expect(released).toBe(true);

    const afterRelease = await engine.acquireLock(lock);
    expect(afterRelease.acquired).toBe(true);
  });

  it('enforces two-chair invariant', async () => {
    const engine = new DistributedSlotLockingEngine();
    const slot = { barberId: 'barber-123', date: '2026-11-15', slotTime: '12:00' };

    const allowed = await engine.enforceTwoChairInvariant({
      ...slot,
      currentActiveBookingsCount: 1,
    });
    expect(allowed.allowed).toBe(true);

    const denied = await engine.enforceTwoChairInvariant({
      ...slot,
      currentActiveBookingsCount: 2,
    });
    expect(denied.allowed).toBe(false);
    expect(denied.reason).toContain('Two-chair invariant violated');
  });
});
