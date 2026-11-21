/* eslint-disable max-lines -- cohesive module (103 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
import { calculateSmartCapacityPayout } from './smart-capacity-payout-optimizer';

export interface BarberTurnoverAnalyticsInput {
  locationId: string;
  operatingStart: Date;
  operatingEnd: Date;
  chairsCount: number;
  barbers: Array<{
    barberId: string;
    name: string;
    baseCommissionRate: number;
    appointments: Array<{
      start: Date;
      end: Date;
      revenue: number;
      serviceName: string;
    }>;
  }>;
}

export interface BarberTurnoverAnalyticsResult {
  locationId: string;
  totalOperatingHours: number;
  totalCapacityMinutes: number;
  totalOccupiedMinutes: number;
  locationOccupancyRate: number;
  totalRevenue: number;
  averageRevenuePerChairHour: number;
  barberPerformance: Array<{
    barberId: string;
    name: string;
    occupancyRate: number;
    totalRevenue: number;
    baseCommissionAmount: number;
    smartCommissionRate: number;
    finalPayoutAmount: number;
    efficiencyGrade: 'A+' | 'A' | 'B' | 'C' | 'D';
    payoutRecommendation: string;
  }>;
  locationRecommendation: string;
}

/**
 * FADE Advanced Barber Turnover & Capacity Analytics Report (T-4623)
 * Aggregates chair utilization, turnover efficiency, and smart payout metrics across all barbers at a location.
 */
export function analyzeBarberTurnoverAnalytics(
  input: BarberTurnoverAnalyticsInput
): BarberTurnoverAnalyticsResult {
  const opStartMs = input.operatingStart.getTime();
  const opEndMs = input.operatingEnd.getTime();
  const totalOperatingHours = Math.max(0, (opEndMs - opStartMs) / 3600000);
  const chairsCount = Math.max(1, input.chairsCount);
  const totalCapacityMinutes = Math.round(totalOperatingHours * 60 * chairsCount);

  let totalOccupiedMinutes = 0;
  let totalRevenue = 0;

  const barberPerformance = input.barbers.map((barber) => {
    const payoutResult = calculateSmartCapacityPayout({
      barberId: barber.barberId,
      operatingStart: input.operatingStart,
      operatingEnd: input.operatingEnd,
      chairs: 1, // per barber chair capacity
      baseCommissionRate: barber.baseCommissionRate,
      existingAppointments: barber.appointments,
    });

    const barberOccupied = barber.appointments.reduce((acc, a) => {
      const dur = Math.max(0, (a.end.getTime() - a.start.getTime()) / 60000);
      return acc + dur;
    }, 0);

    totalOccupiedMinutes += barberOccupied;
    totalRevenue += payoutResult.totalRevenue;

    return {
      barberId: barber.barberId,
      name: barber.name,
      occupancyRate: payoutResult.chairOccupancyRate,
      totalRevenue: payoutResult.totalRevenue,
      baseCommissionAmount: payoutResult.baseCommissionAmount,
      smartCommissionRate: payoutResult.smartCommissionRate,
      finalPayoutAmount: payoutResult.finalPayoutAmount,
      efficiencyGrade: payoutResult.efficiencyGrade,
      payoutRecommendation: payoutResult.payoutRecommendation,
    };
  });

  const locationOccupancyRate =
    totalCapacityMinutes > 0
      ? Math.min(1.0, Math.round((totalOccupiedMinutes / totalCapacityMinutes) * 1000) / 1000)
      : 0;

  const totalChairHours = totalOperatingHours * chairsCount;
  const averageRevenuePerChairHour =
    totalChairHours > 0 ? Math.round((totalRevenue / totalChairHours) * 100) / 100 : 0;

  let locationRecommendation = 'Location operations optimal.';
  if (locationOccupancyRate >= 0.8) {
    locationRecommendation =
      'High location utilization (>80%): Consider opening secondary chair capacity or introducing peak surge pricing.';
  } else if (locationOccupancyRate < 0.4) {
    locationRecommendation =
      'Low location utilization (<40%): Recommend launching promotional walk-in queue incentives and staff schedule consolidation.';
  }

  return {
    locationId: input.locationId,
    totalOperatingHours: Math.round(totalOperatingHours * 10) / 10,
    totalCapacityMinutes,
    totalOccupiedMinutes: Math.round(totalOccupiedMinutes),
    locationOccupancyRate,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    averageRevenuePerChairHour,
    barberPerformance,
    locationRecommendation,
  };
}
