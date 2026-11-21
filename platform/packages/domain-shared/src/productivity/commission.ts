import type { AppointmentCommissionInput, CommissionConfig, CommissionPayoutResult } from './types';

interface RevenueTotals {
  service: number;
  retail: number;
  tips: number;
}

function summarizeRevenue(appointments: AppointmentCommissionInput[]): RevenueTotals {
  return (appointments || []).reduce(
    (totals, appointment) => ({
      service: totals.service + appointment.serviceRevenue,
      retail: totals.retail + appointment.retailRevenue,
      tips: totals.tips + appointment.tips,
    }),
    { service: 0, retail: 0, tips: 0 }
  );
}

function resolveCommissionTier(
  totalPayout: number,
  utilization: number
): CommissionPayoutResult['commissionTier'] {
  if (totalPayout > 50000 || utilization >= 0.9) return 'master';
  if (totalPayout > 30000 || utilization >= 0.8) return 'gold';
  if (totalPayout > 15000 || utilization >= 0.65) return 'silver';
  return 'bronze';
}

export function calculateCommissionPayouts(
  appointments: AppointmentCommissionInput[],
  config: CommissionConfig,
  averageUtilization: number
): CommissionPayoutResult {
  const totals = summarizeRevenue(appointments);
  const basePct = config.baseCommissionPct ?? 45;
  const retailPct = config.retailBonusPct ?? 10;
  const threshold = config.utilizationBonusThresholdPct ?? 0.8;
  const utilBonusPct = config.utilizationBonusPct ?? 5;
  const chairRentalDeduction = config.chairRentalFixedFee ?? 0;

  const baseCommissionAmount = parseFloat(((totals.service * basePct) / 100).toFixed(2));
  const retailBonusAmount = parseFloat(((totals.retail * retailPct) / 100).toFixed(2));
  const utilizationBonusAmount =
    averageUtilization >= threshold
      ? parseFloat(((totals.service * utilBonusPct) / 100).toFixed(2))
      : 0;

  const totalPayout = parseFloat(
    Math.max(
      0,
      baseCommissionAmount +
        retailBonusAmount +
        utilizationBonusAmount +
        totals.tips -
        chairRentalDeduction
    ).toFixed(2)
  );

  return {
    totalServiceRevenue: totals.service,
    totalRetailRevenue: totals.retail,
    totalTips: totals.tips,
    baseCommissionAmount,
    retailBonusAmount,
    utilizationBonusAmount,
    chairRentalDeduction,
    totalPayout,
    commissionTier: resolveCommissionTier(totalPayout, averageUtilization),
    projectedAnnualEarnings: parseFloat((totalPayout * 52).toFixed(2)),
  };
}
