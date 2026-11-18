import { calculateChairUtilizationMetrics } from './chair-utilization';

export interface SmartCapacityPayoutInput {
  barberId: string;
  operatingStart: Date;
  operatingEnd: Date;
  existingAppointments: Array<{ start: Date; end: Date; revenue: number; isFirstVisit?: boolean; hairDensity?: 'fine' | 'normal' | 'thick' | 'coarse' }>;
  chairs?: number;
  baseCommissionRate?: number; // e.g. 0.50 (50%)
}

export interface SmartCapacityPayoutResult {
  barberId: string;
  totalOperatingHours: number;
  chairOccupancyRate: number;
  totalRevenue: number;
  baseCommissionAmount: number;
  tierBonusMultiplier: number;
  smartCommissionRate: number;
  finalPayoutAmount: number;
  efficiencyGrade: 'A+' | 'A' | 'B' | 'C' | 'D';
  payoutRecommendation: string;
}

/**
 * FADE Smart Chair Capacity & Commission Payout Optimizer (T-4621)
 * Combines chair utilization density, barber pacing, and dynamic commission scaling
 * to reward peak chair turnover and high-occupancy performance.
 */
export function calculateSmartCapacityPayout(input: SmartCapacityPayoutInput): SmartCapacityPayoutResult {
  const chairs = input.chairs ?? 1;
  const baseRate = input.baseCommissionRate ?? 0.50;

  const metrics = calculateChairUtilizationMetrics({
    operatingStart: input.operatingStart,
    operatingEnd: input.operatingEnd,
    existing: input.existingAppointments.map(a => ({ start: a.start, end: a.end })),
    chairs,
  });

  const totalRevenue = input.existingAppointments.reduce((sum, a) => sum + a.revenue, 0);
  const baseCommissionAmount = totalRevenue * baseRate;

  let tierBonusMultiplier = 1.0;
  let efficiencyGrade: 'A+' | 'A' | 'B' | 'C' | 'D' = 'C';

  if (metrics.occupancyRate >= 0.85) {
    tierBonusMultiplier = 1.25;
    efficiencyGrade = 'A+';
  } else if (metrics.occupancyRate >= 0.70) {
    tierBonusMultiplier = 1.15;
    efficiencyGrade = 'A';
  } else if (metrics.occupancyRate >= 0.55) {
    tierBonusMultiplier = 1.08;
    efficiencyGrade = 'B';
  } else if (metrics.occupancyRate >= 0.40) {
    tierBonusMultiplier = 1.02;
    efficiencyGrade = 'C';
  } else {
    tierBonusMultiplier = 1.00;
    efficiencyGrade = 'D';
  }

  const smartCommissionRate = baseRate * tierBonusMultiplier;
  const finalPayoutAmount = Math.round((totalRevenue * smartCommissionRate) * 100) / 100;

  const totalOperatingHours = Math.round((input.operatingEnd.getTime() - input.operatingStart.getTime()) / 3600000 * 10) / 10;

  let payoutRecommendation = 'Standard payout schedule applied.';
  if (efficiencyGrade === 'A+') {
    payoutRecommendation = 'Exceptional chair occupancy (>85%): Applied 25% commission bonus multiplier for elite productivity.';
  } else if (efficiencyGrade === 'A') {
    payoutRecommendation = 'High chair occupancy (>70%): Applied 15% commission bonus multiplier.';
  } else if (efficiencyGrade === 'D') {
    payoutRecommendation = 'Low chair occupancy (<40%): Recommend slot consolidation and cross-promotion to increase turnover.';
  }

  return {
    barberId: input.barberId,
    totalOperatingHours,
    chairOccupancyRate: metrics.occupancyRate,
    totalRevenue,
    baseCommissionAmount: Math.round(baseCommissionAmount * 100) / 100,
    tierBonusMultiplier,
    smartCommissionRate: Math.round(smartCommissionRate * 1000) / 1000,
    finalPayoutAmount,
    efficiencyGrade,
    payoutRecommendation,
  };
}
