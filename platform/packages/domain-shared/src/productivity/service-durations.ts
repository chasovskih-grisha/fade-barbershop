import type { ServiceDurationRecord, ServiceDurationRecommendationResult } from './types';

function recommendForRecord(record: ServiceDurationRecord): ServiceDurationRecommendationResult {
  const historical = record.historicalActualDurationsMinutes || [];
  const base = {
    serviceId: record.serviceId,
    serviceName: record.serviceName,
    currentStandardMinutes: record.standardDurationMinutes,
  };

  if (historical.length === 0) {
    return {
      ...base,
      recommendedMinutes: record.standardDurationMinutes,
      adjustmentReason: 'Insufficient historical data; maintaining standard duration.',
      revenueImpactEstimate: 0,
    };
  }

  const averageActual = Math.round(
    historical.reduce((sum, value) => sum + value, 0) / historical.length
  );
  const difference = averageActual - record.standardDurationMinutes;

  if (difference > 4) {
    return {
      ...base,
      recommendedMinutes: Math.ceil((record.standardDurationMinutes + 5) / 5) * 5,
      adjustmentReason: `Historical average (${averageActual}m) exceeds standard by ${difference}m. Increasing booked window by 5m to prevent schedule backlog.`,
      revenueImpactEstimate: -150,
    };
  }
  if (difference < -4) {
    return {
      ...base,
      recommendedMinutes: Math.floor(Math.max(15, record.standardDurationMinutes - 5) / 5) * 5,
      adjustmentReason: `Barber executes faster than standard (${averageActual}m). Decreasing duration by 5m to increase chair throughput.`,
      revenueImpactEstimate: 350,
    };
  }

  return {
    ...base,
    recommendedMinutes: record.standardDurationMinutes,
    adjustmentReason: 'Standard duration matches historical execution speed.',
    revenueImpactEstimate: 0,
  };
}

export function optimizeServiceDurations(
  records: ServiceDurationRecord[]
): ServiceDurationRecommendationResult[] {
  if (!records) return [];
  return records.map(recommendForRecord);
}
