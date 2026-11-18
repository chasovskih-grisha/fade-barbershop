import { optimizeSlotHoldPriority } from './slot-hold-priority-optimizer';

describe('SlotHoldPriorityOptimizer (Booking Engine Optimization Specialist)', () => {
  it('calculates standard lease and extensions for regular non-VIP client', () => {
    const result = optimizeSlotHoldPriority({
      clientLoyaltyVisits: 2,
      isVip: false,
      isPeakSlot: false,
      baseLeaseMinutes: 10,
    });

    expect(result.effectiveLeaseMinutes).toBe(10);
    expect(result.maxExtensionsAllowed).toBe(2);
    expect(result.requiresDepositWaiver).toBe(false);
    expect(result.priorityScore).toBeLessThan(0.3);
  });

  it('grants bonus lease minutes and extensions for VIP clients', () => {
    const result = optimizeSlotHoldPriority({
      clientLoyaltyVisits: 12,
      isVip: true,
      isPeakSlot: true,
      baseLeaseMinutes: 10,
    });

    // base 10 + 5 (vip bonus) - 2 (peak reduction) = 13
    expect(result.effectiveLeaseMinutes).toBe(13);
    expect(result.maxExtensionsAllowed).toBe(3);
    expect(result.requiresDepositWaiver).toBe(true);
    expect(result.priorityScore).toBe(1.0);
  });

  it('handles moderate loyalty visits without VIP flag', () => {
    const result = optimizeSlotHoldPriority({
      clientLoyaltyVisits: 6,
      isVip: false,
      isPeakSlot: false,
      baseLeaseMinutes: 10,
    });

    // base 10 + 5 (loyalty visits >= 5) = 15
    expect(result.effectiveLeaseMinutes).toBe(15);
    expect(result.maxExtensionsAllowed).toBe(3);
    expect(result.requiresDepositWaiver).toBe(false);
  });
});
