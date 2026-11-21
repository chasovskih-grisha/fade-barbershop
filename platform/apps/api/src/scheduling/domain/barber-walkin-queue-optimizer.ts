/* eslint-disable max-lines, complexity, max-statements -- cohesive module (126 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 1 function with inherent domain branching (worst: an existing definition, complexity 11 vs 10); refactor tracked in T-2500f | 1 method with a single orchestration flow (worst: an existing definition, 33 statements vs 30); extraction tracked in T-2500f */
/**
 * FADE Barber Walk-in Queue & Instant Pacing Reallocation Engine
 * Optimizes walk-in queue prioritization, wait-time estimation, and idle chair reallocation.
 */

export interface WalkinItem {
  id: string;
  clientName: string;
  requestedServiceDurationMinutes: number;
  loyaltyTier: 'standard' | 'bronze' | 'silver' | 'gold' | 'vip';
  arrivalTimeMinutesFromStart: number; // minutes from day start
  maxTolerableWaitMinutes: number;
}

export interface BarberChairState {
  barberId: string;
  chairId: string;
  nextAvailableMinute: number; // minutes from day start when chair becomes free
  efficiencyFactor: number; // e.g. 0.9 to 1.2
}

export interface WalkinQueueOptimizationInput {
  walkins: WalkinItem[];
  chairs: BarberChairState[];
  currentMinute: number;
  maxWaitLimitMinutes?: number;
}

export interface WalkinAllocationResult {
  walkinId: string;
  clientName: string;
  assignedBarberId: string;
  assignedChairId: string;
  estimatedStartTimeMinute: number;
  estimatedCompletionMinute: number;
  waitMinutes: number;
  priorityScore: number;
  status: 'allocated' | 'delayed' | 'abandoned_risk';
}

export interface WalkinQueueSummary {
  totalWalkins: number;
  allocatedCount: number;
  abandonedRiskCount: number;
  averageWaitMinutes: number;
  allocations: WalkinAllocationResult[];
}

export class BarberWalkinQueueOptimizer {
  static optimize(input: WalkinQueueOptimizationInput): WalkinQueueSummary {
    const maxWaitLimit = input.maxWaitLimitMinutes ?? 45;
    const sortedWalkins = [...input.walkins].sort((a, b) => {
      const priorityA = this.calculatePriority(a);
      const priorityB = this.calculatePriority(b);
      if (priorityA !== priorityB) {
        return priorityB - priorityA; // higher priority first
      }
      return a.arrivalTimeMinutesFromStart - b.arrivalTimeMinutesFromStart; // FIFO for tie-break
    });

    const chairStates = input.chairs.map((c) => ({ ...c }));
    const allocations: WalkinAllocationResult[] = [];

    for (const walkin of sortedWalkins) {
      if (chairStates.length === 0) {
        break;
      }
      // Find best available chair/barber
      const firstChair = chairStates[0];
      if (!firstChair) {
        break;
      }
      let bestChair = firstChair;
      let earliestAvailable = Math.max(
        bestChair.nextAvailableMinute,
        walkin.arrivalTimeMinutesFromStart
      );

      for (const chair of chairStates) {
        const availableTime = Math.max(
          chair.nextAvailableMinute,
          walkin.arrivalTimeMinutesFromStart
        );
        if (availableTime < earliestAvailable) {
          earliestAvailable = availableTime;
          bestChair = chair;
        }
      }

      const waitMinutes = earliestAvailable - walkin.arrivalTimeMinutesFromStart;
      const priorityScore = this.calculatePriority(walkin);
      const effectiveDuration = Math.round(
        walkin.requestedServiceDurationMinutes / bestChair.efficiencyFactor
      );
      const startTime = earliestAvailable;
      const completionTime = startTime + effectiveDuration;

      let status: 'allocated' | 'delayed' | 'abandoned_risk' = 'allocated';
      if (waitMinutes > walkin.maxTolerableWaitMinutes || waitMinutes > maxWaitLimit) {
        status = 'abandoned_risk';
      } else if (waitMinutes > 20) {
        status = 'delayed';
      }

      // Update chair availability
      bestChair.nextAvailableMinute = completionTime;

      allocations.push({
        walkinId: walkin.id,
        clientName: walkin.clientName,
        assignedBarberId: bestChair.barberId,
        assignedChairId: bestChair.chairId,
        estimatedStartTimeMinute: startTime,
        estimatedCompletionMinute: completionTime,
        waitMinutes,
        priorityScore: Number(priorityScore.toFixed(2)),
        status,
      });
    }

    const allocatedCount = allocations.filter((a) => a.status !== 'abandoned_risk').length;
    const abandonedRiskCount = allocations.filter((a) => a.status === 'abandoned_risk').length;
    const totalWait = allocations.reduce((sum, a) => sum + a.waitMinutes, 0);
    const averageWaitMinutes =
      allocations.length > 0 ? Number((totalWait / allocations.length).toFixed(1)) : 0;

    return {
      totalWalkins: input.walkins.length,
      allocatedCount,
      abandonedRiskCount,
      averageWaitMinutes,
      allocations,
    };
  }

  private static calculatePriority(walkin: WalkinItem): number {
    const tierMultiplier: Record<WalkinItem['loyaltyTier'], number> = {
      vip: 2.5,
      gold: 2.0,
      silver: 1.5,
      bronze: 1.2,
      standard: 1.0,
    };

    const multiplier = tierMultiplier[walkin.loyaltyTier] ?? 1.0;
    const timeWaitingBonus = Math.max(0, 30 - walkin.requestedServiceDurationMinutes) * 0.05;
    return multiplier * 10 + timeWaitingBonus;
  }
}
