/**
 * T-179: Waitlist Cascade Analytics and FIFO Metrics
 *
 * Implement waitlist cascade analytics and FIFO (First-In-First-Out) metrics
 * for tracking slot fill patterns, cascade efficiency, and waitlist performance.
 * Builds on the waitlist infrastructure from T-170/T-171 and priority scoring from T-172.
 */

import { Inject, Injectable } from '@nestjs/common';
import { WaitlistQueue } from '../domain/waitlist-queue';

/**
 * Interface for cascade metrics data
 */
export interface CascadeMetricsData {
  totalSlotsFilled: number;
  cascadeTriggers: number;
  averageCascadeDepth: number;
  medianWaitTime: number;
  fillEfficiency: number; // percentage of slots filled via cascade
  topReasonsForCancellation: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
  slotTurnoverRate: number; // slots filled per hour
  fifoComplianceRate: number; // percentage of slots filled in FIFO order
}

/**
 * T-179: Waitlist Cascade Analytics and FIFO Metrics
 *
 * Provides analytics on waitlist cascade behavior, FIFO compliance,
 * and overall waitlist performance metrics for shop operators.
 */
@Injectable()
export class T179WaitlistCascadeAnalyticsUseCase {
  constructor(@Inject(WaitlistQueue) private waitlistQueue: WaitlistQueue) {}

  /**
   * Get overall cascade and FIFO metrics for the waitlist system.
   */
  async getCascadeMetrics(): Promise<CascadeMetricsData> {
    // Get all slot holds and their outcomes
    const holds = await this.waitlistQueue.getHoldHistory(24); // last 24 hours

    const totalSlotsFilled = holds.filter((h) => h.status === 'booked').length;
    const cascadeTriggers = holds.filter((h) => h.triggerType === 'cascade').length;
    const averageCascadeDepth = this.calculateAverageCascadeDepth(holds);
    const medianWaitTime = this.calculateMedianWaitTime(holds);
    const fillEfficiency =
      totalSlotsFilled > 0
        ? (totalSlotsFilled /
            (totalSlotsFilled + holds.filter((h) => h.status === 'expired').length)) *
          100
        : 100;
    const fifoComplianceRate = this.calculateFifoComplianceRate(holds);

    // Get top reasons for cancellation/no-show
    const topReasons = this.getTopCancellationReasons(holds);

    return {
      totalSlotsFilled,
      cascadeTriggers,
      averageCascadeDepth: Number(averageCascadeDepth.toFixed(2)),
      medianWaitTime: Number(medianWaitTime.toFixed(0)),
      fillEfficiency: Number(fillEfficiency.toFixed(1)),
      topReasonsForCancellation: topReasons,
      slotTurnoverRate: Number((totalSlotsFilled / 24).toFixed(2)),
      fifoComplianceRate: Number(fifoComplianceRate.toFixed(2)),
    };
  }

  /**
   * Calculate average cascade depth from hold history.
   */
  private calculateAverageCascadeDepth(holds: any[]): number {
    const cascadeHolds = holds.filter((h) => h.triggerType === 'cascade');
    if (cascadeHolds.length === 0) return 0;
    const totalDepth = cascadeHolds.reduce((sum, hold) => sum + (hold.cascadeDepth ?? 0), 0);
    return totalDepth / cascadeHolds.length;
  }

  /**
   * Calculate FIFO compliance rate.
   * FIFO compliance = slots filled in the order they were held / total slots filled.
   */
  private calculateFifoComplianceRate(holds: any[]): number {
    const totalFilled = holds.filter((h) => h.status === 'booked').length;
    if (totalFilled === 0) return 100;

    const fifoFilled = holds.filter(
      (h) => h.status === 'booked' && h.fifoCompliant === true
    ).length;
    return (fifoFilled / totalFilled) * 100;
  }

  /**
   * Get top reasons for slot cancellation/no-show.
   */
  private getTopCancellationReasons(
    holds: any[]
  ): Array<{ reason: string; count: number; percentage: number }> {
    const reasonCounts: Record<string, number> = {};

    holds.forEach((hold) => {
      const reason = hold.cancellationReason || 'unknown';
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });

    const total = holds.length || 1;
    return Object.entries(reasonCounts)
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: Number(((count / total) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  /**
   * Calculate median wait time from hold history.
   */
  private calculateMedianWaitTime(holds: any[]): number {
    const waitTimes = holds
      .filter((h) => h.estimatedWaitTime !== undefined && h.estimatedWaitTime > 0)
      .map((h) => h.estimatedWaitTime);

    if (waitTimes.length === 0) return 0;

    const sorted = waitTimes.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
  }
}
