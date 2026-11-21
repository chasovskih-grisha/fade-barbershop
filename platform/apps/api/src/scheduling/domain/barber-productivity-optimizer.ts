/* eslint-disable complexity, max-statements -- 1 function with inherent domain branching (worst: analyzeBarberProductivity, complexity 13 vs 10); refactor tracked in T-2500f | 1 method with a single orchestration flow (worst: analyzeBarberProductivity, 32 statements vs 30); extraction tracked in T-2500f */
import { calculateChairUtilizationMetrics } from './chair-utilization';

export interface BarberProductivityRecommendation {
  barberId: string;
  idleGapsMinutes: Array<{ start: Date; end: Date; durationMinutes: number }>;
  utilizationRate: number;
  recommendedAction: string;
  commissionTier: 'standard' | 'bronze' | 'silver' | 'gold';
  bonusPayoutMultiplier: number;
}

export interface BarberProductivityInput {
  barberId: string;
  operatingStart: Date;
  operatingEnd: Date;
  existing: Array<{ start: Date; end: Date; chairs: number }>;
  chairs?: number;
}

/**
 * Optimizes barber scheduling, analyzes idle gaps, and computes performance-based commission tiers.
 */
export function analyzeBarberProductivity(
  input: BarberProductivityInput
): BarberProductivityRecommendation {
  const chairs = input.chairs ?? 1;
  const metrics = calculateChairUtilizationMetrics({
    operatingStart: input.operatingStart,
    operatingEnd: input.operatingEnd,
    existing: input.existing,
    chairs,
  });

  const opStartMs = input.operatingStart.getTime();
  const opEndMs = input.operatingEnd.getTime();

  const sortedIntervals = input.existing
    .map((b) => ({
      start: Math.max(opStartMs, b.start.getTime()),
      end: Math.min(opEndMs, b.end.getTime()),
    }))
    .filter((b) => b.end > b.start)
    .sort((a, b) => a.start - b.start);

  const idleGapsMinutes: Array<{ start: Date; end: Date; durationMinutes: number }> = [];
  let currentPointer = opStartMs;

  for (const interval of sortedIntervals) {
    if (interval.start > currentPointer) {
      const gapDuration = Math.round((interval.start - currentPointer) / 60000);
      if (gapDuration >= 15) {
        // report gaps of 15+ minutes
        idleGapsMinutes.push({
          start: new Date(currentPointer),
          end: new Date(interval.start),
          durationMinutes: gapDuration,
        });
      }
    }
    currentPointer = Math.max(currentPointer, interval.end);
  }

  if (currentPointer < opEndMs) {
    const gapDuration = Math.round((opEndMs - currentPointer) / 60000);
    if (gapDuration >= 15) {
      idleGapsMinutes.push({
        start: new Date(currentPointer),
        end: new Date(opEndMs),
        durationMinutes: gapDuration,
      });
    }
  }

  let commissionTier: 'standard' | 'bronze' | 'silver' | 'gold' = 'standard';
  let bonusPayoutMultiplier = 1.0;

  if (metrics.occupancyRate >= 0.85) {
    commissionTier = 'gold';
    bonusPayoutMultiplier = 1.2;
  } else if (metrics.occupancyRate >= 0.7) {
    commissionTier = 'silver';
    bonusPayoutMultiplier = 1.1;
  } else if (metrics.occupancyRate >= 0.5) {
    commissionTier = 'bronze';
    bonusPayoutMultiplier = 1.05;
  }

  let recommendedAction = 'Schedule stable';
  if (metrics.occupancyRate < 0.4) {
    recommendedAction =
      'High idle time detected: Consider opening promotional quick-booking slots or cross-training services.';
  } else if (idleGapsMinutes.length > 2) {
    recommendedAction =
      'Fragmented schedule: Compact appointments to eliminate dead time between chairs.';
  } else if (metrics.occupancyRate >= 0.85) {
    recommendedAction =
      'Peak capacity utilization: Eligible for surge pricing and priority tier bonus payout.';
  }

  return {
    barberId: input.barberId,
    idleGapsMinutes,
    utilizationRate: metrics.occupancyRate,
    recommendedAction,
    commissionTier,
    bonusPayoutMultiplier,
  };
}
