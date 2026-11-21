import type { DynamicPriceInput } from './service.types';

export interface DynamicPriceResult {
  adjustedPriceCents: number;
  tierMultiplier: number;
  peakMultiplier: number;
  weekendMultiplier: number;
}

/**
 * Calculates dynamic service pricing from tier, peak-hour and weekend multipliers.
 */
export function calculateDynamicServicePrice(input: DynamicPriceInput): DynamicPriceResult {
  const { service, tier, isPeakHour, isWeekend } = input;
  const tierMultiplier = service.tierMultipliers[tier] ?? 1.0;
  const peakMultiplier = isPeakHour ? service.peakHourMultiplier : 1.0;
  const weekendMultiplier = isWeekend ? service.weekendMultiplier : 1.0;

  return {
    adjustedPriceCents: Math.round(
      service.basePriceCents * tierMultiplier * peakMultiplier * weekendMultiplier
    ),
    tierMultiplier,
    peakMultiplier,
    weekendMultiplier,
  };
}
