import { optimizeSlotLockRecovery, SlotLockRecord } from './slot-lock-recovery-optimizer';

describe('SlotLockRecoveryOptimizer', () => {
  it('identifies active locks and valid remaining TTL correctly', () => {
    const now = 1000000;
    const records: SlotLockRecord[] = [
      {
        lockId: 'lock-1',
        slotId: 'slot-10',
        barberId: 'barber-1',
        clientId: 'client-1',
        lockedAtTimestamp: now - 60000, // locked 1 min ago
        expiresAtTimestamp: now + 240000, // expires in 4 mins
        currentTimestamp: now,
        isCheckoutActive: true,
        contentionCount: 1,
      },
    ];

    const results = optimizeSlotLockRecovery(records);
    expect(results[0]?.status).toBe('ACTIVE');
    expect(results[0]?.actionRecommended).toBe('HOLD');
    expect(results[0]?.contentionSeverity).toBe('LOW');
  });

  it('recovers expired locks when checkout is inactive or expired beyond grace', () => {
    const now = 1000000;
    const records: SlotLockRecord[] = [
      {
        lockId: 'lock-2',
        slotId: 'slot-11',
        barberId: 'barber-1',
        clientId: 'client-2',
        lockedAtTimestamp: now - 400000,
        expiresAtTimestamp: now - 10000, // expired 10s ago
        currentTimestamp: now,
        isCheckoutActive: false,
        contentionCount: 0,
      },
    ];

    const results = optimizeSlotLockRecovery(records);
    expect(results[0]?.status).toBe('EXPIRED_RECOVERED');
    expect(results[0]?.actionRecommended).toBe('RELEASE_SLOT');
  });

  it('extends grace period for active checkout near expiration', () => {
    const now = 1000000;
    const records: SlotLockRecord[] = [
      {
        lockId: 'lock-3',
        slotId: 'slot-12',
        barberId: 'barber-2',
        clientId: 'client-3',
        lockedAtTimestamp: now - 280000,
        expiresAtTimestamp: now + 20000, // expires in 20s (< 60s)
        currentTimestamp: now,
        isCheckoutActive: true,
        contentionCount: 2,
      },
    ];

    const results = optimizeSlotLockRecovery(records);
    expect(results[0]?.status).toBe('GRACE_EXTENDED');
    expect(results[0]?.actionRecommended).toBe('EXTEND_LEASE');
    expect(results[0]?.graceExtensionAppliedMs).toBe(120000);
    expect(results[0]?.contentionSeverity).toBe('MEDIUM');
  });

  it('forces unlock on critical contention deadlocks', () => {
    const now = 1000000;
    const records: SlotLockRecord[] = [
      {
        lockId: 'lock-4',
        slotId: 'slot-13',
        barberId: 'barber-3',
        clientId: 'client-4',
        lockedAtTimestamp: now - 100000,
        expiresAtTimestamp: now + 200000,
        currentTimestamp: now,
        isCheckoutActive: false,
        contentionCount: 6, // critical contention (> 5)
      },
    ];

    const results = optimizeSlotLockRecovery(records);
    expect(results[0]?.status).toBe('DEADLOCK_RESOLVED');
    expect(results[0]?.actionRecommended).toBe('FORCE_UNLOCK');
    expect(results[0]?.contentionSeverity).toBe('CRITICAL');
  });
});
