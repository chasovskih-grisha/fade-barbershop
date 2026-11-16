import { CancellationProtectionManager } from '../src/protection';

describe('CancellationProtectionManager', () => {
  let manager: CancellationProtectionManager;

  beforeEach(() => {
    manager = new CancellationProtectionManager(
      { minServicePrice: 50, depositPercentage: 30 },
      3,
      1800000
    );
  });

  test('calculates required deposit correctly', () => {
    // Below min service price ($50) -> $0 deposit
    expect(manager.calculateRequiredDeposit(40)).toBe(0);

    // At or above min service price -> 30% deposit rounded
    expect(manager.calculateRequiredDeposit(100)).toBe(30); // 30% of 100 = 30
    expect(manager.calculateRequiredDeposit(150)).toBe(45); // 30% of 150 = 45
  });

  test('deposit lifecycle: create, pay, and resolve on cancellation', () => {
    const record = manager.createDeposit('appt-1', 'client-A', 100);
    expect(record.amount).toBe(30);
    expect(record.status).toBe('PENDING');

    const marked = manager.markDepositPaid('appt-1');
    expect(marked).toBe(true);

    // Timely cancellation -> refunded
    const statusTimely = manager.resolveDepositOnCancellation('appt-1', false, false);
    expect(statusTimely).toBe('REFUNDED');

    // Late cancellation or no show -> forfeited
    const record2 = manager.createDeposit('appt-2', 'client-A', 100);
    manager.markDepositPaid('appt-2');
    const statusLate = manager.resolveDepositOnCancellation('appt-2', true, false);
    expect(statusLate).toBe('FORFEITED');
  });

  test('waitlist auto-promotion and TTL expiration', () => {
    manager.addToWaitlist({
      id: 'wl-1',
      clientId: 'client-B',
      barberId: 'barber-1',
      preferredStartTime: '2026-11-20T10:00:00Z',
      flexibleHours: 2,
      priorityScore: 10,
    });

    // Cancelled slot falls within flexible window (11:00 AM)
    const notified = manager.processCancellationAndPromote('barber-1', '2026-11-20T11:00:00Z');
    expect(notified).not.toBeNull();
    expect(notified?.id).toBe('wl-1');
    expect(notified?.status).toBe('NOTIFIED');

    // Client responds with acceptance within TTL
    const accepted = manager.respondToWaitlistOffer('wl-1', true);
    expect(accepted).toBe(true);
  });

  test('client penalty and strike suspension mechanism', () => {
    // First late cancellation (+1 strike)
    const penalty1 = manager.recordNoShowOrLateCancellation('client-C', false);
    expect(penalty1.strikes).toBe(1);
    expect(penalty1.isSuspended).toBe(false);

    // No-show (+2 strikes, total 3 -> reaches maxStrikes = 3, gets suspended)
    const penalty2 = manager.recordNoShowOrLateCancellation('client-C', true);
    expect(penalty2.strikes).toBe(3);
    expect(penalty2.isSuspended).toBe(true);
    expect(penalty2.suspendedUntil).toBeDefined();

    expect(manager.getClientPenalty('client-C')?.isSuspended).toBe(true);
  });
});
