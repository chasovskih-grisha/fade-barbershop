import { optimizeSlotCongestion, SlotDemandRecord } from './slot-congestion-optimizer';

describe('SlotCongestionOptimizer', () => {
  it('identifies peak, normal, and off-peak slots correctly', () => {
    const records: SlotDemandRecord[] = [
      { slotHour: 10, isWeekend: false, bookedCount: 9, totalCapacity: 10 }, // 0.9 -> PEAK
      { slotHour: 14, isWeekend: false, bookedCount: 5, totalCapacity: 10 }, // 0.5 -> NORMAL
      { slotHour: 18, isWeekend: false, bookedCount: 2, totalCapacity: 10 }, // 0.2 -> OFF_PEAK
    ];

    const results = optimizeSlotCongestion(records);

    const r0 = results[0]!;
    const r1 = results[1]!;
    const r2 = results[2]!;

    expect(r0.tier).toBe('PEAK');
    expect(r0.pricingMultiplier).toBe(1.2);
    expect(r0.recommendedAlternativeHour).toBe(18);

    expect(r1.tier).toBe('NORMAL');
    expect(r1.pricingMultiplier).toBe(1.0);
    expect(r1.recommendedAlternativeHour).toBeUndefined();

    expect(r2.tier).toBe('OFF_PEAK');
    expect(r2.pricingMultiplier).toBe(0.9);
  });

  it('handles edge case capacities and empty records gracefully', () => {
    const records: SlotDemandRecord[] = [
      { slotHour: 9, isWeekend: true, bookedCount: 0, totalCapacity: 0 },
    ];

    const results = optimizeSlotCongestion(records);
    const r0 = results[0]!;
    expect(r0.congestionRate).toBe(0);
    expect(r0.tier).toBe('OFF_PEAK');
  });
});
