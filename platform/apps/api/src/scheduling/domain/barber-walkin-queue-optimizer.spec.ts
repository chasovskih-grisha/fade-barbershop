import { BarberWalkinQueueOptimizer } from './barber-walkin-queue-optimizer';

describe('BarberWalkinQueueOptimizer', () => {
  it('should prioritize VIP and Gold walk-ins and assign available chairs', () => {
    const summary = BarberWalkinQueueOptimizer.optimize({
      walkins: [
        { id: 'w1', clientName: 'Alice', requestedServiceDurationMinutes: 30, loyaltyTier: 'standard', arrivalTimeMinutesFromStart: 10, maxTolerableWaitMinutes: 20 },
        { id: 'w2', clientName: 'Bob', requestedServiceDurationMinutes: 45, loyaltyTier: 'vip', arrivalTimeMinutesFromStart: 12, maxTolerableWaitMinutes: 40 },
      ],
      chairs: [
        { barberId: 'b1', chairId: 'c1', nextAvailableMinute: 0, efficiencyFactor: 1.0 },
        { barberId: 'b2', chairId: 'c2', nextAvailableMinute: 15, efficiencyFactor: 1.1 },
      ],
      currentMinute: 10,
    });

    expect(summary.totalWalkins).toBe(2);
    expect(summary.allocations.length).toBe(2);
    // VIP Bob should be scheduled or prioritized
    const bobAllocation = summary.allocations.find(a => a.walkinId === 'w2');
    expect(bobAllocation).toBeDefined();
    expect(bobAllocation?.status).toBe('allocated');
  });

  it('should flag abandoned risk if wait time exceeds tolerable limits', () => {
    const summary = BarberWalkinQueueOptimizer.optimize({
      walkins: [
        { id: 'w3', clientName: 'Charlie', requestedServiceDurationMinutes: 30, loyaltyTier: 'standard', arrivalTimeMinutesFromStart: 0, maxTolerableWaitMinutes: 5 },
      ],
      chairs: [
        { barberId: 'b1', chairId: 'c1', nextAvailableMinute: 60, efficiencyFactor: 1.0 },
      ],
      currentMinute: 0,
    });

    expect(summary.abandonedRiskCount).toBe(1);
    expect(summary.allocations[0]!.status).toBe('abandoned_risk');
  });
});
