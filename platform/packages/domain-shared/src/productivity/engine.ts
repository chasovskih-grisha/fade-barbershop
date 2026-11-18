import {
  ChairUtilizationRecord,
  ServiceDurationRecord,
  CommissionConfig,
  AppointmentCommissionInput,
  ProductivityReportRequest,
  ChairThroughputResult,
  ServiceDurationRecommendationResult,
  CommissionPayoutResult,
  ProductivityReportResult,
} from './types';

export class BarberProductivityEngine {
  /**
   * Calculate chair utilization, idle gaps, and throughput metrics.
   */
  public calculateChairUtilization(records: ChairUtilizationRecord[]): ChairThroughputResult {
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

    for (const r of records) {
      totalWorking += r.totalWorkingMinutes;
      totalBooked += r.bookedServiceMinutes;
      const idle = r.idleGaps.reduce((acc, g) => acc + g.durationMinutes, 0);
      totalIdle += idle;
    }

    const averageUtilizationRate = totalWorking > 0 ? parseFloat((totalBooked / totalWorking).toFixed(2)) : 0;
    const peakHourCongestionScore = Math.min(100, Math.round(averageUtilizationRate * 110));

    let recommendedGapCompressionAction = 'Chair utilization is optimal.';
    let dynamicBufferRecommendedMinutes = 5;
    let chairTurnaroundEfficiencyRating: 'Optimal' | 'Under-utilized' | 'Over-congested' = 'Optimal';

    if (averageUtilizationRate < 0.65) {
      recommendedGapCompressionAction = 'High idle time detected. Enable dynamic gap compression to back-to-back walk-ins.';
      dynamicBufferRecommendedMinutes = 0; // tighter scheduling when idle
      chairTurnaroundEfficiencyRating = 'Under-utilized';
    } else if (averageUtilizationRate > 0.90) {
      recommendedGapCompressionAction = 'Chair is near max capacity. Consider introducing staggered buffer times to prevent burnout.';
      dynamicBufferRecommendedMinutes = 10; // larger buffer to prevent fatigue & delays
      chairTurnaroundEfficiencyRating = 'Over-congested';
    }

    return {
      averageUtilizationRate,
      peakHourCongestionScore,
      totalIdleMinutes: totalIdle,
      recommendedGapCompressionAction,
      dynamicBufferRecommendedMinutes,
      chairTurnaroundEfficiencyRating,
    };
  }

  /**
   * Analyze historical service durations and recommend adjustments.
   */
  public optimizeServiceDurations(records: ServiceDurationRecord[]): ServiceDurationRecommendationResult[] {
    if (!records) return [];

    return records.map((rec) => {
      const historical = rec.historicalActualDurationsMinutes || [];
      if (historical.length === 0) {
        return {
          serviceId: rec.serviceId,
          serviceName: rec.serviceName,
          currentStandardMinutes: rec.standardDurationMinutes,
          recommendedMinutes: rec.standardDurationMinutes,
          adjustmentReason: 'Insufficient historical data; maintaining standard duration.',
          revenueImpactEstimate: 0,
        };
      }

      const avgActual = Math.round(historical.reduce((a, b) => a + b, 0) / historical.length);
      const diff = avgActual - rec.standardDurationMinutes;

      let recommendedMinutes = rec.standardDurationMinutes;
      let adjustmentReason = 'Standard duration matches historical execution speed.';
      let revenueImpactEstimate = 0;

      if (diff > 4) {
        recommendedMinutes = rec.standardDurationMinutes + 5;
        recommendedMinutes = Math.ceil(recommendedMinutes / 5) * 5; // round to nearest 5
        adjustmentReason = `Historical average (${avgActual}m) exceeds standard by ${diff}m. Increasing booked window by 5m to prevent schedule backlog.`;
        revenueImpactEstimate = -150; // slight capacity adjustment trade-off
      } else if (diff < -4) {
        recommendedMinutes = Math.max(15, rec.standardDurationMinutes - 5);
        recommendedMinutes = Math.floor(recommendedMinutes / 5) * 5;
        adjustmentReason = `Barber executes faster than standard (${avgActual}m). Decreasing duration by 5m to increase chair throughput.`;
        revenueImpactEstimate = 350; // estimated monthly revenue gain from freeing up slots
      }

      return {
        serviceId: rec.serviceId,
        serviceName: rec.serviceName,
        currentStandardMinutes: rec.standardDurationMinutes,
        recommendedMinutes,
        adjustmentReason,
        revenueImpactEstimate,
      };
    });
  }

  /**
   * Calculate detailed commission, retail bonus, utilization bonus, and payout.
   */
  public calculateCommissionPayouts(
    appointments: AppointmentCommissionInput[],
    config: CommissionConfig,
    averageUtilization: number
  ): CommissionPayoutResult {
    const apps = appointments || [];
    let totalServiceRevenue = 0;
    let totalRetailRevenue = 0;
    let totalTips = 0;

    for (const app of apps) {
      totalServiceRevenue += app.serviceRevenue;
      totalRetailRevenue += app.retailRevenue;
      totalTips += app.tips;
    }

    const basePct = config.baseCommissionPct ?? 45;
    const baseCommissionAmount = parseFloat(((totalServiceRevenue * basePct) / 100).toFixed(2));

    const retailPct = config.retailBonusPct ?? 10;
    const retailBonusAmount = parseFloat(((totalRetailRevenue * retailPct) / 100).toFixed(2));

    const threshold = config.utilizationBonusThresholdPct ?? 0.80;
    const utilBonusPct = config.utilizationBonusPct ?? 5;
    const isEligibleForUtilBonus = averageUtilization >= threshold;
    const utilizationBonusAmount = isEligibleForUtilBonus
      ? parseFloat(((totalServiceRevenue * utilBonusPct) / 100).toFixed(2))
      : 0;

    const chairRentalDeduction = config.chairRentalFixedFee ?? 0;

    const totalPayout = parseFloat(
      Math.max(0, baseCommissionAmount + retailBonusAmount + utilizationBonusAmount + totalTips - chairRentalDeduction).toFixed(2)
    );
    const projectedAnnualEarnings = parseFloat((totalPayout * 52).toFixed(2)); // assuming weekly cycle annualized

    let commissionTier: 'bronze' | 'silver' | 'gold' | 'master' = 'bronze';
    if (totalPayout > 50000 || averageUtilization >= 0.90) {
      commissionTier = 'master';
    } else if (totalPayout > 30000 || averageUtilization >= 0.80) {
      commissionTier = 'gold';
    } else if (totalPayout > 15000 || averageUtilization >= 0.65) {
      commissionTier = 'silver';
    }

    return {
      totalServiceRevenue,
      totalRetailRevenue,
      totalTips,
      baseCommissionAmount,
      retailBonusAmount,
      utilizationBonusAmount,
      chairRentalDeduction,
      totalPayout,
      commissionTier,
      projectedAnnualEarnings,
    };
  }

  /**
   * Generate comprehensive barber productivity and capacity report.
   */
  public generateProductivityReport(request: ProductivityReportRequest): ProductivityReportResult {
    const chairThroughput = this.calculateChairUtilization(request.chairRecords);
    const serviceDurationRecommendations = this.optimizeServiceDurations(request.serviceRecords);
    const payoutSummary = this.calculateCommissionPayouts(
      request.appointments,
      request.commissionConfig,
      chairThroughput.averageUtilizationRate
    );

    // Compute overall productivity score (0 - 100)
    const utilScore = chairThroughput.averageUtilizationRate * 60;
    const revScore = Math.min(40, (payoutSummary.totalServiceRevenue / 50000) * 40);
    const overallScore = Math.min(100, Math.round(utilScore + revScore));

    let productivityBadge: 'Elite Performer' | 'High Growth' | 'Steady Operator' | 'Needs Optimization' = 'Steady Operator';
    if (overallScore >= 90) {
      productivityBadge = 'Elite Performer';
    } else if (overallScore >= 75) {
      productivityBadge = 'High Growth';
    } else if (overallScore >= 50) {
      productivityBadge = 'Steady Operator';
    } else {
      productivityBadge = 'Needs Optimization';
    }

    return {
      barberId: request.barberId,
      chairThroughput,
      serviceDurationRecommendations,
      payoutSummary,
      overallScore,
      productivityBadge,
    };
  }
}
