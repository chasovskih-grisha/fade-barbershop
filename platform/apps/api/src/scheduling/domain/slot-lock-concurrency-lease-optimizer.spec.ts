import {
  optimizeSlotLeaseConcurrency,
  DEFAULT_SLOT_LEASE_CONFIG,
} from './slot-lock-concurrency-lease-optimizer';

describe('SlotLockConcurrencyLeaseOptimizer', () => {
  it('should keep valid active leases untouched', () => {
    const now = 1000000;
    const results = optimizeSlotLeaseConcurrency([
      {
        leaseId: 'lease-1',
        slotId: 'slot-101',
        barberId: 'barber-1',
        clientId: 'client-1',
        version: 1,
        acquiredAtTimestamp: now - 10000,
        expiresAtTimestamp: now + 120000,
        currentTimestamp: now,
        heartbeatCount: 1,
        contentionScore: 2,
      },
    ]);

    expect(results).toHaveLength(1);
    const lease0 = results[0];
    expect(lease0?.status).toBe('ACTIVE');
    expect(lease0?.actionRequired).toBe('PROCEED_CHECKOUT');
    expect(lease0?.newVersion).toBe(1);
  });

  it('should renew leases expiring soon with active heartbeats', () => {
    const now = 1000000;
    const results = optimizeSlotLeaseConcurrency([
      {
        leaseId: 'lease-2',
        slotId: 'slot-102',
        barberId: 'barber-1',
        clientId: 'client-2',
        version: 2,
        acquiredAtTimestamp: now - 150000,
        expiresAtTimestamp: now + 20000, // < 45000ms TTL remaining
        currentTimestamp: now,
        heartbeatCount: 2,
        contentionScore: 1,
      },
    ]);

    expect(results).toHaveLength(1);
    const lease1 = results[0];
    expect(lease1?.status).toBe('RENEWED');
    expect(lease1?.actionRequired).toBe('REQUEST_HEARTBEAT');
    expect(lease1?.newVersion).toBe(3);
    expect(lease1?.newExpiresAtTimestamp).toBe(now + DEFAULT_SLOT_LEASE_CONFIG.defaultLeaseTtlMs);
  });

  it('should expire leases whose TTL has passed', () => {
    const now = 1000000;
    const results = optimizeSlotLeaseConcurrency([
      {
        leaseId: 'lease-3',
        slotId: 'slot-103',
        barberId: 'barber-2',
        clientId: 'client-3',
        version: 1,
        acquiredAtTimestamp: now - 300000,
        expiresAtTimestamp: now - 1000, // already expired
        currentTimestamp: now,
        heartbeatCount: 0,
        contentionScore: 3,
      },
    ]);

    expect(results).toHaveLength(1);
    const lease2 = results[0];
    expect(lease2?.status).toBe('EXPIRED');
    expect(lease2?.actionRequired).toBe('RELEASE_AND_RETRY');
  });

  it('should evict leases under critical contention score', () => {
    const now = 1000000;
    const results = optimizeSlotLeaseConcurrency([
      {
        leaseId: 'lease-4',
        slotId: 'slot-104',
        barberId: 'barber-2',
        clientId: 'client-4',
        version: 4,
        acquiredAtTimestamp: now - 20000,
        expiresAtTimestamp: now + 100000,
        currentTimestamp: now,
        heartbeatCount: 1,
        contentionScore: 10, // >= 8 threshold
      },
    ]);

    expect(results).toHaveLength(1);
    const lease3 = results[0];
    expect(lease3?.status).toBe('EVICTED_HIGH_CONTENTION');
    expect(lease3?.actionRequired).toBe('FORCE_EVICT');
  });
});
