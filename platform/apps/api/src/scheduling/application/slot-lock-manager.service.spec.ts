/* eslint-disable max-lines -- cohesive module (162 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
import {
  SlotLockManagerService,
  DEFAULT_SLOT_LOCK_CONFIG,
  SlotLockConflictError,
} from './slot-lock-manager.service';

describe('SlotLockManagerService (Booking Engine Optimization Specialist)', () => {
  let service: SlotLockManagerService;
  const slotStart = new Date('2026-11-15T14:00:00Z');
  const slotEnd = new Date('2026-11-15T15:00:00Z');

  beforeEach(() => {
    service = new SlotLockManagerService(DEFAULT_SLOT_LOCK_CONFIG);
  });

  it('successfully acquires a lock on an available slot', () => {
    const now = new Date('2026-11-15T10:00:00Z');
    const lock = service.acquireLock(
      {
        slotId: 'slot_123',
        barberId: 'barber_1',
        locationId: 'loc_1',
        clientSessionId: 'session_A',
        slotStart,
        slotEnd,
      },
      now
    );

    expect(lock.lockId).toBeDefined();
    expect(lock.barberId).toBe('barber_1');
    expect(lock.clientSessionId).toBe('session_A');
    expect(lock.expiresAt.getTime()).toBe(now.getTime() + 10 * 60 * 1000);
  });

  it('returns existing lock if requested by the same client session', () => {
    const now = new Date('2026-11-15T10:00:00Z');
    const lock1 = service.acquireLock(
      {
        slotId: 'slot_123',
        barberId: 'barber_1',
        locationId: 'loc_1',
        clientSessionId: 'session_A',
        slotStart,
        slotEnd,
      },
      now
    );

    const lock2 = service.acquireLock(
      {
        slotId: 'slot_123',
        barberId: 'barber_1',
        locationId: 'loc_1',
        clientSessionId: 'session_A',
        slotStart,
        slotEnd,
      },
      new Date('2026-11-15T10:02:00Z')
    );

    expect(lock1.lockId).toBe(lock2.lockId);
  });

  it('throws SlotLockConflictError when a different session tries to lock an active slot', () => {
    const now = new Date('2026-11-15T10:00:00Z');
    service.acquireLock(
      {
        slotId: 'slot_123',
        barberId: 'barber_1',
        locationId: 'loc_1',
        clientSessionId: 'session_A',
        slotStart,
        slotEnd,
      },
      now
    );

    expect(() => {
      service.acquireLock(
        {
          slotId: 'slot_123',
          barberId: 'barber_1',
          locationId: 'loc_1',
          clientSessionId: 'session_B',
          slotStart,
          slotEnd,
        },
        new Date('2026-11-15T10:01:00Z')
      );
    }).toThrow(SlotLockConflictError);
  });

  it('allows extending lock within limits for the owner session', () => {
    const now = new Date('2026-11-15T10:00:00Z');
    const lock = service.acquireLock(
      {
        slotId: 'slot_123',
        barberId: 'barber_1',
        locationId: 'loc_1',
        clientSessionId: 'session_A',
        slotStart,
        slotEnd,
      },
      now
    );

    const extended = service.extendLock(lock.lockId, 'session_A', new Date('2026-11-15T10:05:00Z'));
    expect(extended.extendedCount).toBe(1);
    expect(extended.expiresAt.getTime()).toBe(lock.expiresAt.getTime() + 5 * 60 * 1000);
  });

  it('releases lock successfully when requested by owner', () => {
    const now = new Date('2026-11-15T10:00:00Z');
    const lock = service.acquireLock(
      {
        slotId: 'slot_123',
        barberId: 'barber_1',
        locationId: 'loc_1',
        clientSessionId: 'session_A',
        slotStart,
        slotEnd,
      },
      now
    );

    const released = service.releaseLock(lock.lockId, 'session_A');
    expect(released).toBe(true);

    // Now another session should be able to acquire it
    const lockB = service.acquireLock(
      {
        slotId: 'slot_123',
        barberId: 'barber_1',
        locationId: 'loc_1',
        clientSessionId: 'session_B',
        slotStart,
        slotEnd,
      },
      new Date('2026-11-15T10:01:00Z')
    );
    expect(lockB.clientSessionId).toBe('session_B');
  });

  it('purges expired locks', () => {
    const now = new Date('2026-11-15T10:00:00Z');
    service.acquireLock(
      {
        slotId: 'slot_123',
        barberId: 'barber_1',
        locationId: 'loc_1',
        clientSessionId: 'session_A',
        slotStart,
        slotEnd,
      },
      now
    );

    const futureTime = new Date('2026-11-15T11:15:00Z'); // past 10 min lease
    const purgedCount = service.purgeExpiredLocks(futureTime);
    expect(purgedCount).toBe(1);
  });

  it('throws RangeError if slot end time is before or equal to start time', () => {
    const now = new Date('2026-11-15T10:00:00Z');
    expect(() => {
      service.acquireLock(
        {
          slotId: 'slot_123',
          barberId: 'barber_1',
          locationId: 'loc_1',
          clientSessionId: 'session_A',
          slotStart: slotEnd,
          slotEnd: slotStart,
        },
        now
      );
    }).toThrow(RangeError);
  });
});
