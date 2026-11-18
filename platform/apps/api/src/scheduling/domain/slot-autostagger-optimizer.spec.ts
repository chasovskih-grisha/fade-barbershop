import { optimizeSlotStaggering } from './slot-autostagger-optimizer';

describe('SlotAutostaggerOptimizer', () => {
  it('applies no offset for low congestion or VIP clients', () => {
    const result = optimizeSlotStaggering({
      requestedStartTimeIso: '2026-11-15T10:00:00.000Z',
      simultaneousBookingsInWindow: 1,
      chairCapacity: 3,
      serviceDurationMinutes: 30,
      clientVipStatus: true,
    });

    expect(result.offsetMinutes).toBe(0);
    expect(result.congestionMitigationApplied).toBe(false);
    expect(result.assignedChairId).toBe('chair-1');
  });

  it('staggers start time during peak congestion windows', () => {
    const result = optimizeSlotStaggering({
      requestedStartTimeIso: '2026-11-15T14:00:00.000Z',
      simultaneousBookingsInWindow: 4,
      chairCapacity: 2,
      serviceDurationMinutes: 45,
      clientVipStatus: false,
    });

    expect(result.offsetMinutes).toBeGreaterThan(0);
    expect(result.congestionMitigationApplied).toBe(true);
    expect(result.staggeredStartTimeIso).not.toBe(result.originalStartTimeIso);
  });
});
