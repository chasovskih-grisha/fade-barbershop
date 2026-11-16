export interface ChairUtilizationRecord {
  barberId: string;
  chairId: string;
  date: string; // YYYY-MM-DD
  totalMinutesAvailable: number;
  totalMinutesBooked: number;
  walkInMinutesBooked: number;
  breakMinutes: number;
}

export interface ServiceDurationEstimate {
  serviceId: string;
  serviceName: string;
  baseDurationMinutes: number;
  historicalAverageMinutes: number;
  adjustmentFactor: number; // e.g. 1.05 for 5% longer based on historical telemetry
}

export interface CommissionPayoutItem {
  barberId: string;
  barberName: string;
  serviceRevenue: number;
  productRevenue: number;
  tipTotal: number;
  baseCommissionRate: number; // e.g. 0.50 (50%)
  retailCommissionRate: number; // e.g. 0.10 (10%)
  chairRentalFee: number;
  bonusMultiplier: number;
}

export class BarberProductivityEngine {
  /**
   * 1. Calculate Chair Utilization Rate (%)
   */
  public calculateChairUtilization(record: ChairUtilizationRecord): { utilizationRate: number; idleMinutes: number; efficiencyScore: string } {
    const activeWorkingMinutes = Math.max(0, record.totalMinutesAvailable - record.breakMinutes);
    if (activeWorkingMinutes === 0) {
      return { utilizationRate: 0, idleMinutes: 0, efficiencyScore: 'N/A' };
    }

    const totalBooked = record.totalMinutesBooked + record.walkInMinutesBooked;
    const utilizationRate = Math.min(100, Math.round((totalBooked / activeWorkingMinutes) * 10000) / 100);
    const idleMinutes = Math.max(0, activeWorkingMinutes - totalBooked);

    let efficiencyScore = 'Standard';
    if (utilizationRate >= 85) {
      efficiencyScore = 'Elite / High Demand';
    } else if (utilizationRate >= 70) {
      efficiencyScore = 'Optimal';
    } else if (utilizationRate < 45) {
      efficiencyScore = 'Underutilized / Capacity Available';
    }

    return { utilizationRate, idleMinutes, efficiencyScore };
  }

  /**
   * 2. Optimize Service Duration Estimates based on historical telemetry
   */
  public optimizeServiceDuration(estimate: ServiceDurationEstimate): { recommendedDurationMinutes: number; varianceMinutes: number } {
    const computed = estimate.historicalAverageMinutes * estimate.adjustmentFactor;
    // Round to nearest 5 minutes for scheduling slot alignment
    const recommendedDurationMinutes = Math.max(5, Math.round(computed / 5) * 5);
    const varianceMinutes = recommendedDurationMinutes - estimate.baseDurationMinutes;

    return { recommendedDurationMinutes, varianceMinutes };
  }

  /**
   * 3. Calculate Commission & Payout Report
   */
  public calculateCommissionPayout(item: CommissionPayoutItem): { netCommission: number; finalPayout: number; effectiveRate: number } {
    const serviceCommission = item.serviceRevenue * item.baseCommissionRate * item.bonusMultiplier;
    const retailCommission = item.productRevenue * item.retailCommissionRate;
    const grossEarnings = serviceCommission + retailCommission + item.tipTotal;
    const netCommission = Math.round(grossEarnings * 100) / 100;
    const finalPayout = Math.max(0, Math.round((netCommission - item.chairRentalFee) * 100) / 100);

    const totalRevenue = item.serviceRevenue + item.productRevenue;
    const effectiveRate = totalRevenue > 0 ? Math.round((netCommission / totalRevenue) * 10000) / 100 : 0;

    return {
      netCommission,
      finalPayout,
      effectiveRate
    };
  }

  /**
   * 4. Schedule Slot Optimizer / Queue Gap Minimizer
   */
  public optimizeScheduleGaps(gaps: { slotStart: string; durationMinutes: number }[], targetServiceDuration: number): { recommendedSlotStart: string; gapMinutes: number } | null {
    // Find smallest gap that can accommodate targetServiceDuration with minimal wasted idle time
    let bestSlot: { slotStart: string; durationMinutes: number } | null = null;
    let minRemainder = Infinity;

    for (const gap of gaps) {
      if (gap.durationMinutes >= targetServiceDuration) {
        const remainder = gap.durationMinutes - targetServiceDuration;
        if (remainder < minRemainder) {
          minRemainder = remainder;
          bestSlot = gap;
        }
      }
    }

    if (!bestSlot) return null;

    return {
      recommendedSlotStart: bestSlot.slotStart,
      gapMinutes: bestSlot.durationMinutes
    };
  }
}
