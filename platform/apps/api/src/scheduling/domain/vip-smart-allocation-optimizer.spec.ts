import { optimizeVipSmartAllocation } from './vip-smart-allocation-optimizer';

describe('VipSmartAllocationOptimizer', () => {
  it('should give high priority score and extended hold for VIP clients', () => {
    const result = optimizeVipSmartAllocation({
      clientId: 'client-vip-1',
      clientLoyaltyVisits: 15,
      clientLifetimeSpentCents: 450000,
      isVip: true,
      serviceId: 'service-fade-deluxe',
      serviceBasePriceCents: 6500,
      barberId: 'barber-1',
      barberUtilizationScore: 0.90,
      requestedSlotTimestamp: '2026-11-15T14:00:00Z',
      isPeakHour: true,
    });

    expect(result.allocationScore).toBeGreaterThanOrEqual(0.85);
    expect(result.reservedHoldWindowMinutes).toBeGreaterThan(10);
    expect(result.autoAssignedPriorityQueue).toBe(true);
    expect(result.recommendedSurgeMultiplier).toBeGreaterThanOrEqual(1.10);
  });

  it('should handle standard non-VIP clients correctly during off-peak hours', () => {
    const result = optimizeVipSmartAllocation({
      clientId: 'client-std-1',
      clientLoyaltyVisits: 2,
      clientLifetimeSpentCents: 9000,
      isVip: false,
      serviceId: 'service-classic-cut',
      serviceBasePriceCents: 4000,
      barberId: 'barber-2',
      barberUtilizationScore: 0.40,
      requestedSlotTimestamp: '2026-11-15T10:00:00Z',
      isPeakHour: false,
    });

    expect(result.allocationScore).toBeLessThan(0.40);
    expect(result.reservedHoldWindowMinutes).toBe(10);
    expect(result.autoAssignedPriorityQueue).toBe(false);
    expect(result.recommendedSurgeMultiplier).toBe(1.0);
    expect(result.dynamicBufferMinutes).toBe(5);
  });
});
