export interface SlotDemandRecord {
  slotHour: number; // 0 - 23
  isWeekend: boolean;
  bookedCount: number;
  totalCapacity: number;
}

export interface SlotCongestionResult {
  slotHour: number;
  congestionRate: number; // 0.0 to 1.0
  tier: 'PEAK' | 'NORMAL' | 'OFF_PEAK';
  pricingMultiplier: number; // e.g. 1.2 for peak surge, 0.9 for off-peak discount
  recommendedAlternativeHour?: number;
}

export interface SlotCongestionOptimizerConfig {
  peakThreshold: number; // e.g. 0.8
  offPeakThreshold: number; // e.g. 0.3
  peakMultiplier: number; // e.g. 1.25
  offPeakDiscountMultiplier: number; // e.g. 0.85
  normalMultiplier: number; // e.g. 1.0
}

export const DEFAULT_SLOT_CONGESTION_CONFIG: SlotCongestionOptimizerConfig = {
  peakThreshold: 0.75,
  offPeakThreshold: 0.35,
  peakMultiplier: 1.2,
  offPeakDiscountMultiplier: 0.9,
  normalMultiplier: 1.0,
};

/**
 * Calculates slot congestion metrics and dynamic pricing multipliers to balance booking loads.
 */
export function optimizeSlotCongestion(
  records: SlotDemandRecord[],
  config: SlotCongestionOptimizerConfig = DEFAULT_SLOT_CONGESTION_CONFIG
): SlotCongestionResult[] {
  const results: SlotCongestionResult[] = records.map((record) => {
    const totalCapacity = Math.max(1, record.totalCapacity);
    const congestionRate = Number(
      Math.min(1.0, Math.max(0, record.bookedCount / totalCapacity)).toFixed(4)
    );

    let tier: 'PEAK' | 'NORMAL' | 'OFF_PEAK' = 'NORMAL';
    let pricingMultiplier = config.normalMultiplier;

    if (congestionRate >= config.peakThreshold) {
      tier = 'PEAK';
      pricingMultiplier = config.peakMultiplier;
    } else if (congestionRate <= config.offPeakThreshold) {
      tier = 'OFF_PEAK';
      pricingMultiplier = config.offPeakDiscountMultiplier;
    }

    return {
      slotHour: record.slotHour,
      congestionRate,
      tier,
      pricingMultiplier,
    };
  });

  // Find best off-peak alternative hours for peak slots
  const offPeakHours = results.filter((r) => r.tier === 'OFF_PEAK').map((r) => r.slotHour);

  for (const res of results) {
    if (res.tier === 'PEAK' && offPeakHours.length > 0) {
      // Find closest off-peak hour
      const firstOffPeak = offPeakHours[0];
      if (firstOffPeak === undefined) continue;
      let closest: number = firstOffPeak;
      let minDiff = Math.abs(res.slotHour - closest);
      for (const oh of offPeakHours) {
        const diff = Math.abs(res.slotHour - oh);
        if (diff < minDiff) {
          minDiff = diff;
          closest = oh;
        }
      }
      res.recommendedAlternativeHour = closest;
    }
  }

  return results;
}
