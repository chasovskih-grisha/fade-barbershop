import { BookingInterval } from './chair-capacity';

export interface ChairUtilizationMetricsInput {
  operatingStart: Date;
  operatingEnd: Date;
  existing: BookingInterval[];
  chairs: number;
}

export interface ChairUtilizationResult {
  totalCapacityMinutes: number;
  occupiedMinutes: number;
  occupancyRate: number; // 0.0 to 1.0
  chairHoursAvailable: number;
  chairHoursOccupied: number;
}

/**
 * Calculates chair utilization metrics for a given time window and operating chairs.
 */
export function calculateChairUtilizationMetrics({
  operatingStart,
  operatingEnd,
  existing,
  chairs,
}: ChairUtilizationMetricsInput): ChairUtilizationResult {
  const totalDurationMs = operatingEnd.getTime() - operatingStart.getTime();
  if (!Number.isInteger(chairs) || chairs < 1 || totalDurationMs <= 0) {
    return {
      totalCapacityMinutes: 0,
      occupiedMinutes: 0,
      occupancyRate: 0,
      chairHoursAvailable: 0,
      chairHoursOccupied: 0,
    };
  }

  const totalCapacityMinutes = Math.round((totalDurationMs / 60000) * chairs);
  const chairHoursAvailable = Number((totalCapacityMinutes / 60).toFixed(2));

  const opStartMs = operatingStart.getTime();
  const opEndMs = operatingEnd.getTime();

  const clippedIntervals = existing
    .map((b) => ({
      start: Math.max(opStartMs, b.start.getTime()),
      end: Math.min(opEndMs, b.end.getTime()),
    }))
    .filter((b) => b.end > b.start)
    .sort((a, b) => a.start - b.start);

  const merged: Array<{ start: number; end: number }> = [];
  for (const interval of clippedIntervals) {
    const last = merged[merged.length - 1];
    if (!last || interval.start > last.end) {
      merged.push({ ...interval });
    } else {
      last.end = Math.max(last.end, interval.end);
    }
  }

  let occupiedMs = 0;
  for (const interval of merged) {
    occupiedMs += interval.end - interval.start;
  }

  const occupiedMinutes = Math.round(occupiedMs / 60000);
  const chairHoursOccupied = Number((occupiedMinutes / 60).toFixed(2));
  const occupancyRate =
    totalCapacityMinutes > 0 ? Number((occupiedMinutes / totalCapacityMinutes).toFixed(4)) : 0;

  return {
    totalCapacityMinutes,
    occupiedMinutes,
    occupancyRate,
    chairHoursAvailable,
    chairHoursOccupied,
  };
}
