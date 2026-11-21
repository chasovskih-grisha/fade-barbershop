/* eslint-disable max-lines, complexity, max-statements -- cohesive module (103 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 1 function with inherent domain branching (worst: analyzeBarberCommissionTierProductivity, complexity 14 vs 10); refactor tracked in T-2500f | 1 method with a single orchestration flow (worst: analyzeBarberCommissionTierProductivity, 37 statements vs 30); extraction tracked in T-2500f */
import { calculateChairUtilizationMetrics } from './chair-utilization';

export interface BarberCommissionTierRecommendation {
  barberId: string;
  idleGapsMinutes: Array<{ start: Date; end: Date; durationMinutes: number }>;
  utilizationRate: number;
  recommendedAction: string;
  commissionTier: 'standard' | 'bronze' | 'silver' | 'gold' | 'platinum';
  bonusPayoutMultiplier: number;
  chairTurnoverEfficiency: number;
}

export interface BarberCommissionTierInput {
  barberId: string;
  operatingStart: Date;
  operatingEnd: Date;
  existing: Array<{ start: Date; end: Date; chairs?: number }>;
  chairs?: number;
}

/**
 * Optimizes barber scheduling, analyzes idle gaps, and computes performance-based multi-tier commission and payout multipliers.
 */
export function analyzeBarberCommissionTierProductivity(
  input: BarberCommissionTierInput
): BarberCommissionTierRecommendation {
  const chairs = input.chairs ?? 1;
  const metrics = calculateChairUtilizationMetrics({
    operatingStart: input.operatingStart,
    operatingEnd: input.operatingEnd,
    existing: input.existing.map((e) => ({ ...e, chairs: e.chairs ?? chairs })),
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

  let commissionTier: 'standard' | 'bronze' | 'silver' | 'gold' | 'platinum' = 'standard';
  let bonusPayoutMultiplier = 1.0;

  if (metrics.occupancyRate >= 0.9) {
    commissionTier = 'platinum';
    bonusPayoutMultiplier = 1.3;
  } else if (metrics.occupancyRate >= 0.8) {
    commissionTier = 'gold';
    bonusPayoutMultiplier = 1.2;
  } else if (metrics.occupancyRate >= 0.65) {
    commissionTier = 'silver';
    bonusPayoutMultiplier = 1.1;
  } else if (metrics.occupancyRate >= 0.45) {
    commissionTier = 'bronze';
    bonusPayoutMultiplier = 1.05;
  }

  let recommendedAction = 'Schedule stable and well-paced.';
  if (metrics.occupancyRate < 0.35) {
    recommendedAction =
      'Low utilization: Recommend opening walk-in buffer slots or running targeted client reactivation.';
  } else if (idleGapsMinutes.length > 2) {
    recommendedAction =
      'Fragmented schedule: Suggest compacting back-to-back bookings to minimize chair downtime.';
  } else if (metrics.occupancyRate >= 0.85) {
    recommendedAction =
      'Peak performance: Eligible for high-tier commission bonus payout and surge capacity rate.';
  }

  const totalOperatingMinutes = Math.max(1, Math.round((opEndMs - opStartMs) / 60000));
  const bookedMinutes = sortedIntervals.reduce(
    (acc, curr) => acc + (curr.end - curr.start) / 60000,
    0
  );
  const chairTurnoverEfficiency = Number((bookedMinutes / totalOperatingMinutes).toFixed(2));

  return {
    barberId: input.barberId,
    idleGapsMinutes,
    utilizationRate: metrics.occupancyRate,
    recommendedAction,
    commissionTier,
    bonusPayoutMultiplier,
    chairTurnoverEfficiency,
  };
}
