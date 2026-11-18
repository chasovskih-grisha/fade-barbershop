import { evaluateSlotDeadlockPrevention, DEFAULT_SLOT_DEADLOCK_CONFIG, SlotHoldRequest } from './slot-deadlock-prevention';

describe('evaluateSlotDeadlockPrevention', () => {
  const now = new Date('2026-11-11T12:00:00Z');

  it('allows slot hold when client is well within limits', () => {
    const currentHolds: SlotHoldRequest[] = [
      { slotId: 'slot-1', clientId: 'client-123', requestedAt: new Date(now.getTime() - 10000), ttlSeconds: 300 },
    ];
    const incoming: SlotHoldRequest = { slotId: 'slot-2', clientId: 'client-123', requestedAt: now, ttlSeconds: 300 };

    const result = evaluateSlotDeadlockPrevention(currentHolds, incoming, DEFAULT_SLOT_DEADLOCK_CONFIG);
    expect(result.isAllowed).toBe(true);
    expect(result.activeHoldCount).toBe(1);
    expect(result.backoffSeconds).toBe(0);
  });

  it('rejects slot hold when max concurrent holds is exceeded', () => {
    const currentHolds: SlotHoldRequest[] = [
      { slotId: 'slot-1', clientId: 'client-123', requestedAt: new Date(now.getTime() - 15000), ttlSeconds: 300 },
      { slotId: 'slot-2', clientId: 'client-123', requestedAt: new Date(now.getTime() - 10000), ttlSeconds: 300 },
      { slotId: 'slot-3', clientId: 'client-123', requestedAt: new Date(now.getTime() - 5000), ttlSeconds: 300 },
    ];
    const incoming: SlotHoldRequest = { slotId: 'slot-4', clientId: 'client-123', requestedAt: now, ttlSeconds: 300 };

    const result = evaluateSlotDeadlockPrevention(currentHolds, incoming, DEFAULT_SLOT_DEADLOCK_CONFIG);
    expect(result.isAllowed).toBe(false);
    expect(result.activeHoldCount).toBe(3);
    expect(result.backoffSeconds).toBeGreaterThan(0);
    expect(result.reason).toContain('maximum concurrent slot holds');
  });

  it('rejects slot hold when hold velocity exceeds suspicious threshold', () => {
    const currentHolds: SlotHoldRequest[] = [
      { slotId: 'slot-1', clientId: 'client-456', requestedAt: new Date(now.getTime() - 10000), ttlSeconds: 300 },
      { slotId: 'slot-2', clientId: 'client-456', requestedAt: new Date(now.getTime() - 8000), ttlSeconds: 300 },
      { slotId: 'slot-3', clientId: 'client-456', requestedAt: new Date(now.getTime() - 6000), ttlSeconds: 300 },
      { slotId: 'slot-4', clientId: 'client-456', requestedAt: new Date(now.getTime() - 4000), ttlSeconds: 300 },
      { slotId: 'slot-5', clientId: 'client-456', requestedAt: new Date(now.getTime() - 2000), ttlSeconds: 300 },
    ];
    const incoming: SlotHoldRequest = { slotId: 'slot-6', clientId: 'client-456', requestedAt: now, ttlSeconds: 300 };

    const result = evaluateSlotDeadlockPrevention(currentHolds, incoming, DEFAULT_SLOT_DEADLOCK_CONFIG);
    expect(result.isAllowed).toBe(false);
    expect(result.reason).toContain('Suspicious slot hold velocity');
  });
});
