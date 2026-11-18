/**
 * FADE Barber Peak-Load Capacity & Dynamic Overflow Auto-Dispatch Engine
 * Optimizes peak hour chair allocation, waitlist auto-dispatch, and off-peak break shifting.
 */

export interface PeakLoadBarberState {
  barberId: string;
  chairId: string;
  currentQueueLength: number;
  utilizationRate: number; // 0.0 to 1.0
  isAuxiliaryChair: boolean;
  speedFactor: number; // e.g. 0.9 to 1.2
}

export interface WaitlistClientEntry {
  clientId: string;
  clientName: string;
  serviceDurationMinutes: number;
  priorityScore: number;
  requestedTimeSlotMinute: number;
}

export interface PeakLoadOptimizationInput {
  barbers: PeakLoadBarberState[];
  waitlist: WaitlistClientEntry[];
  currentMinute: number;
  peakThresholdUtilization?: number;
}

export interface DispatchAllocation {
  clientId: string;
  clientName: string;
  assignedBarberId: string;
  assignedChairId: string;
  dispatchStatus: 'dispatched_primary' | 'dispatched_auxiliary' | 'deferred_overflow';
  effectiveServiceDurationMinutes: number;
}

export interface PeakLoadDispatchSummary {
  totalWaitlistClients: number;
  dispatchedCount: number;
  deferredCount: number;
  auxiliaryChairsActivated: number;
  shopThroughputEfficiencyScore: number;
  allocations: DispatchAllocation[];
}

export class BarberPeakLoadDispatchOptimizer {
  static optimize(input: PeakLoadOptimizationInput): PeakLoadDispatchSummary {
    const peakThreshold = input.peakThresholdUtilization ?? 0.80;
    const sortedWaitlist = [...input.waitlist].sort((a, b) => b.priorityScore - a.priorityScore);
    const barbers = input.barbers.map(b => ({ ...b }));

    const allocations: DispatchAllocation[] = [];
    let auxiliaryCount = 0;

    // Identify primary vs auxiliary barbers
    const primaryBarbers = barbers.filter(b => !b.isAuxiliaryChair);
    const auxiliaryBarbers = barbers.filter(b => b.isAuxiliaryChair);

    for (const client of sortedWaitlist) {
      // Find least congested primary barber
      let bestBarber = primaryBarbers.sort((a, b) => a.currentQueueLength - b.currentQueueLength)[0];
      let status: 'dispatched_primary' | 'dispatched_auxiliary' | 'deferred_overflow' = 'dispatched_primary';

      if (!bestBarber || bestBarber.currentQueueLength >= 3 || bestBarber.utilizationRate >= peakThreshold) {
        // Try auxiliary chair if primary is congested
        const bestAux = auxiliaryBarbers.sort((a, b) => a.currentQueueLength - b.currentQueueLength)[0];
        if (bestAux && bestAux.currentQueueLength < 4) {
          bestBarber = bestAux;
          status = 'dispatched_auxiliary';
          auxiliaryCount++;
        } else if (!bestBarber) {
          allocations.push({
            clientId: client.clientId,
            clientName: client.clientName,
            assignedBarberId: 'NONE',
            assignedChairId: 'NONE',
            dispatchStatus: 'deferred_overflow',
            effectiveServiceDurationMinutes: client.serviceDurationMinutes,
          });
          continue;
        } else {
          status = 'dispatched_primary';
        }
      }

      bestBarber.currentQueueLength += 1;
      const effectiveDuration = Math.round(client.serviceDurationMinutes / bestBarber.speedFactor);

      allocations.push({
        clientId: client.clientId,
        clientName: client.clientName,
        assignedBarberId: bestBarber.barberId,
        assignedChairId: bestBarber.chairId,
        dispatchStatus: status,
        effectiveServiceDurationMinutes: effectiveDuration,
      });
    }

    const dispatchedCount = allocations.filter(a => a.dispatchStatus !== 'deferred_overflow').length;
    const deferredCount = allocations.filter(a => a.dispatchStatus === 'deferred_overflow').length;
    const shopThroughputEfficiencyScore = input.waitlist.length > 0
      ? Number(((dispatchedCount / input.waitlist.length) * 100).toFixed(1))
      : 100.0;

    return {
      totalWaitlistClients: input.waitlist.length,
      dispatchedCount,
      deferredCount,
      auxiliaryChairsActivated: auxiliaryCount,
      shopThroughputEfficiencyScore,
      allocations,
    };
  }
}
