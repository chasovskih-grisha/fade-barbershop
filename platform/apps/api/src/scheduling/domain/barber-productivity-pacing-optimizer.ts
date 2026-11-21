import { calculateChairUtilizationMetrics } from './chair-utilization';

export interface BarberProductivityPacingInput {
  barberId: string;
  operatingStart: Date;
  operatingEnd: Date;
  scheduledAppointments: Array<{
    start: Date;
    end: Date;
    serviceName: string;
    hairDensity?: 'fine' | 'normal' | 'thick' | 'coarse';
  }>;
  targetPacingMinutesPerClient?: number; // e.g. default 30 mins
  chairSanitationBufferMinutes?: number; // e.g. default 5 mins
}

export interface BarberProductivityPacingResult {
  barberId: string;
  totalOperatingHours: number;
  totalClients: number;
  averageServiceDurationMinutes: number;
  chairOccupancyRate: number;
  pacingEfficiencyScore: number; // 0 to 100
  pacingRating: 'Elite' | 'Optimal' | 'Pacing Deficit' | 'Overburdened';
  recommendations: string[];
}

/**
 * FADE Barber Productivity & Pacing Optimizer (T-4634)
 * Analyzes barber chair turnover, hair density pacing friction, and sanitation recovery buffers
 * to maximize daily throughput and prevent burnout.
 */
export function calculateBarberProductivityPacing(
  input: BarberProductivityPacingInput
): BarberProductivityPacingResult {
  const sanitationBuffer = input.chairSanitationBufferMinutes ?? 5;
  const totalClients = input.scheduledAppointments.length;

  const operatingDurationMs = input.operatingEnd.getTime() - input.operatingStart.getTime();
  const totalOperatingHours = Math.round((operatingDurationMs / 3600000) * 10) / 10;

  let totalDurationMinutes = 0;
  for (const appt of input.scheduledAppointments) {
    let duration = (appt.end.getTime() - appt.start.getTime()) / 60000;
    // Apply density friction factor if specified
    if (appt.hairDensity === 'thick') duration *= 1.15;
    if (appt.hairDensity === 'coarse') duration *= 1.25;
    totalDurationMinutes += duration + sanitationBuffer;
  }

  const averageServiceDurationMinutes =
    totalClients > 0 ? Math.round((totalDurationMinutes / totalClients) * 10) / 10 : 0;

  const metrics = calculateChairUtilizationMetrics({
    operatingStart: input.operatingStart,
    operatingEnd: input.operatingEnd,
    existing: input.scheduledAppointments.map((a) => ({ start: a.start, end: a.end })),
    chairs: 1,
  });

  const occupancyRate = metrics.occupancyRate;

  // Compute pacing efficiency score (0 - 100)
  // Ideal occupancy ~ 0.75 - 0.85
  const pacingEfficiencyScore = Math.round(Math.min(100, Math.max(0, (occupancyRate / 0.8) * 100)));

  let pacingRating: 'Elite' | 'Optimal' | 'Pacing Deficit' | 'Overburdened' = 'Optimal';
  const recommendations: string[] = [];

  if (occupancyRate > 0.9) {
    pacingRating = 'Overburdened';
    recommendations.push(
      'High risk of fatigue: Barber is operating above 90% chair occupancy without adequate recovery gaps.'
    );
    recommendations.push(
      'Recommend adding a 10-minute micro-break or activating the chair sanitation buffer parser.'
    );
  } else if (occupancyRate >= 0.75) {
    pacingRating = 'Elite';
    recommendations.push('Elite pacing and chair turnover achieved. Excellent revenue velocity.');
  } else if (occupancyRate >= 0.5) {
    pacingRating = 'Optimal';
    recommendations.push('Balanced workflow and steady chair utilization.');
  } else {
    pacingRating = 'Pacing Deficit';
    recommendations.push(
      'Under-utilized capacity: Recommend opening walk-in standby slots or smart bundle promotion.'
    );
  }

  return {
    barberId: input.barberId,
    totalOperatingHours,
    totalClients,
    averageServiceDurationMinutes,
    chairOccupancyRate: occupancyRate,
    pacingEfficiencyScore,
    pacingRating,
    recommendations,
  };
}
