import {
  calculateBarberCommissionAndPayout,
  CommissionCalculationResult,
} from './barber-commission-tier';
import { ChairUtilizationResult, calculateChairUtilizationMetrics } from './chair-utilization';

export interface BarberRevenueForecastInput {
  barberId: string;
  operatingStart: Date;
  operatingEnd: Date;
  existingBookings: Array<{ start: Date; end: Date }>;
  chairs: number;
  averageServicePrice: number;
  averageProductSalesPerBooking: number;
  baseCommissionRate?: number;
}

export interface BarberRevenueForecastResult {
  barberId: string;
  utilization: ChairUtilizationResult;
  projectedBookingsCount: number;
  projectedServiceRevenue: number;
  projectedProductRevenue: number;
  totalGrossRevenue: number;
  commissionReport: CommissionCalculationResult;
  netBarberEarnings: number;
  shopNetRevenue: number;
  efficiencyRating: 'optimal' | 'moderate' | 'underutilized';
  optimizationRecommendation: string;
}

/**
 * Forecasts barber revenue, occupancy-based commission tiers, and shop net return
 * to maximize chair utilization and productivity.
 */
export function forecastBarberRevenue(
  input: BarberRevenueForecastInput
): BarberRevenueForecastResult {
  const utilization = calculateChairUtilizationMetrics({
    operatingStart: input.operatingStart,
    operatingEnd: input.operatingEnd,
    existing: input.existingBookings,
    chairs: input.chairs,
  });

  // Estimate number of bookings based on occupied minutes (assuming avg 45 min per booking)
  const averageServiceDurationMinutes = 45;
  const projectedBookingsCount = Math.round(
    utilization.occupiedMinutes / averageServiceDurationMinutes
  );

  const projectedServiceRevenue = Number(
    (projectedBookingsCount * input.averageServicePrice).toFixed(2)
  );
  const projectedProductRevenue = Number(
    (projectedBookingsCount * input.averageProductSalesPerBooking).toFixed(2)
  );
  const totalGrossRevenue = Number((projectedServiceRevenue + projectedProductRevenue).toFixed(2));

  const commissionReport = calculateBarberCommissionAndPayout({
    barberId: input.barberId,
    baseServiceRevenue: projectedServiceRevenue,
    productSalesRevenue: projectedProductRevenue,
    occupancyRate: utilization.occupancyRate,
    ...(input.baseCommissionRate !== undefined
      ? { customBaseCommissionRate: input.baseCommissionRate }
      : {}),
  });

  const netBarberEarnings = commissionReport.totalPayoutAmount;
  const shopNetRevenue = Number((totalGrossRevenue - netBarberEarnings).toFixed(2));

  let efficiencyRating: 'optimal' | 'moderate' | 'underutilized' = 'underutilized';
  let optimizationRecommendation =
    'Occupancy is low: activate waitlist promotion and flash discount slots.';

  if (utilization.occupancyRate >= 0.75) {
    efficiencyRating = 'optimal';
    optimizationRecommendation =
      'High chair utilization: maintain peak service pacing and incentivize retail attach rates.';
  } else if (utilization.occupancyRate >= 0.5) {
    efficiencyRating = 'moderate';
    optimizationRecommendation =
      'Stable utilization: fill mid-day gaps with targeted loyalty re-bookings.';
  }

  return {
    barberId: input.barberId,
    utilization,
    projectedBookingsCount,
    projectedServiceRevenue,
    projectedProductRevenue,
    totalGrossRevenue,
    commissionReport,
    netBarberEarnings,
    shopNetRevenue,
    efficiencyRating,
    optimizationRecommendation,
  };
}
