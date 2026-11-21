import type { ChairThroughputResult, ChairUtilizationRecord } from './types';

interface UtilizationGuidance {
  action: string;
  bufferMinutes: number;
  rating: ChairThroughputResult['chairTurnaroundEfficiencyRating'];
}

function resolveGuidance(rate: number): UtilizationGuidance {
  if (rate < 0.65) {
    return {
      action: 'High idle time detected. Enable dynamic gap compression to back-to-back walk-ins.',
      bufferMinutes: 0,
      rating: 'Under-utilized',
    };
  }
  if (rate > 0.9) {
    return {
      action:
        'Chair is near max capacity. Consider introducing staggered buffer times to prevent burnout.',
      bufferMinutes: 10,
      rating: 'Over-congested',
    };
  }
  return {
    action: 'Chair utilization is optimal.',
    bufferMinutes: 5,
    rating: 'Optimal',
  };
}

export function calculateChairUtilization(
  records: ChairUtilizationRecord[]
): ChairThroughputResult {
  if (!records || records.length === 0) {
    return {
      averageUtilizationRate: 0,
      peakHourCongestionScore: 0,
      totalIdleMinutes: 0,
      recommendedGapCompressionAction: 'No utilization records available.',
      dynamicBufferRecommendedMinutes: 5,
      chairTurnaroundEfficiencyRating: 'Optimal',
    };
  }

  let totalWorking = 0;
  let totalBooked = 0;
  let totalIdle = 0;
  for (const record of records) {
    totalWorking += record.totalWorkingMinutes;
    totalBooked += record.bookedServiceMinutes;
    totalIdle += record.idleGaps.reduce((sum, gap) => sum + gap.durationMinutes, 0);
  }

  const averageUtilizationRate =
    totalWorking > 0 ? parseFloat((totalBooked / totalWorking).toFixed(2)) : 0;
  const guidance = resolveGuidance(averageUtilizationRate);

  return {
    averageUtilizationRate,
    peakHourCongestionScore: Math.min(100, Math.round(averageUtilizationRate * 110)),
    totalIdleMinutes: totalIdle,
    recommendedGapCompressionAction: guidance.action,
    dynamicBufferRecommendedMinutes: guidance.bufferMinutes,
    chairTurnaroundEfficiencyRating: guidance.rating,
  };
}
