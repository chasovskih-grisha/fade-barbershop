const { DistributedSlotLockingEngine } = require('../distributed-lock');

describe('DistributedSlotLockingEngine', () => {
  it('acquires and releases locks correctly', async () => {
    const engine = new DistributedSlotLockingEngine();
    const barberId = 'barber-123';
    const date = '2026-11-15';
    const slotTime = '10:00';

    const res1 = await engine.acquireLock(barberId, date, slotTime);
    expect(res1.acquired).toBe(true);
    expect(res1.token).toBeTruthy();

    const res2 = await engine.acquireLock(barberId, date, slotTime, { retryCount: 0 });
    expect(res2.acquired).toBe(false);

    const released = await engine.releaseLock(res1.lockKey, res1.token);
    expect(released).toBe(true);

    const res3 = await engine.acquireLock(barberId, date, slotTime);
    expect(res3.acquired).toBe(true);
  });

  it('enforces two-chair invariant', async () => {
    const engine = new DistributedSlotLockingEngine();
    const barberId = 'barber-123';
    const date = '2026-11-15';
    const slotTime = '12:00';

    const check1 = await engine.enforceTwoChairInvariant(barberId, date, slotTime, 1);
    expect(check1.allowed).toBe(true);

    const check2 = await engine.enforceTwoChairInvariant(barberId, date, slotTime, 2);
    expect(check2.allowed).toBe(false);
    expect(check2.reason).toContain('Two-chair invariant violated');
  });
});
