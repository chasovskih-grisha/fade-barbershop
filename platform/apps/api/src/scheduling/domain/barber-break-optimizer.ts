export interface BarberAppointmentInterval {
  id: string;
  start: Date;
  end: Date;
}

export interface BarberBreakOptimizationInput {
  barberId: string;
  shiftStart: Date;
  shiftEnd: Date;
  appointments: BarberAppointmentInterval[];
  maxContinuousMinutesWithoutBreak?: number; // default 180 mins (3 hours)
  minBreakDurationMinutes?: number; // default 15 mins
}

export interface RecommendedBreakSlot {
  start: Date;
  end: Date;
  durationMinutes: number;
  reason: string;
}

export interface BarberBreakOptimizationResult {
  barberId: string;
  fatigueIndex: number; // 0.0 to 1.0
  burnoutRisk: 'low' | 'moderate' | 'high';
  recommendedBreaks: RecommendedBreakSlot[];
  continuousBlocksCount: number;
}

/**
 * Optimizes barber shift pacing and recommends recovery micro-breaks to prevent fatigue and maintain high service quality.
 */
export function optimizeBarberBreaks(input: BarberBreakOptimizationInput): BarberBreakOptimizationResult {
  const maxContinuous = input.maxContinuousMinutesWithoutBreak ?? 180;
  const minBreak = input.minBreakDurationMinutes ?? 15;

  const sortedAppointments = [...input.appointments].sort((a, b) => a.start.getTime() - b.start.getTime());

  let continuousMinutes = 0;
  let consecutiveCount = 0;
  const recommendedBreaks: RecommendedBreakSlot[] = [];
  let lastAppointmentEnd = input.shiftStart.getTime();

  for (let i = 0; i < sortedAppointments.length; i++) {
    const appt = sortedAppointments[i];
    if (!appt) continue;
    const apptStartMs = appt.start.getTime();
    const apptEndMs = appt.end.getTime();
    const duration = Math.round((apptEndMs - apptStartMs) / 60000);

    const gapBefore = Math.round((apptStartMs - lastAppointmentEnd) / 60000);

    if (gapBefore >= minBreak) {
      continuousMinutes = duration;
      consecutiveCount = 1;
    } else {
      continuousMinutes += duration + Math.max(0, gapBefore);
      consecutiveCount++;
    }

    if (continuousMinutes >= maxContinuous || consecutiveCount >= 4) {
      const nextAppt = sortedAppointments[i + 1];
      const nextStartMs = nextAppt ? nextAppt.start.getTime() : input.shiftEnd.getTime();
      const currentGapAfter = Math.round((nextStartMs - apptEndMs) / 60000);

      if (currentGapAfter < minBreak && nextAppt) {
        recommendedBreaks.push({
          start: new Date(apptEndMs),
          end: new Date(apptEndMs + minBreak * 60000),
          durationMinutes: minBreak,
          reason: `Fatigue mitigation: ${continuousMinutes} continuous working minutes accumulated across ${consecutiveCount} appointments without mandatory recovery break.`,
        });
      }
      continuousMinutes = 0;
      consecutiveCount = 0;
    }

    lastAppointmentEnd = apptEndMs;
  }

  const totalWorkedMinutes = sortedAppointments.reduce(
    (acc, a) => acc + Math.round((a.end.getTime() - a.start.getTime()) / 60000),
    0
  );
  const shiftTotalMinutes = Math.max(1, Math.round((input.shiftEnd.getTime() - input.shiftStart.getTime()) / 60000));
  const loadRatio = totalWorkedMinutes / shiftTotalMinutes;

  let fatigueIndex = Math.min(1.0, loadRatio * (1 + recommendedBreaks.length * 0.1));
  fatigueIndex = Math.round(fatigueIndex * 100) / 100;

  let burnoutRisk: 'low' | 'moderate' | 'high' = 'low';
  if (fatigueIndex >= 0.80 || recommendedBreaks.length >= 2) {
    burnoutRisk = 'high';
  } else if (fatigueIndex >= 0.55 || recommendedBreaks.length === 1) {
    burnoutRisk = 'moderate';
  }

  return {
    barberId: input.barberId,
    fatigueIndex,
    burnoutRisk,
    recommendedBreaks,
    continuousBlocksCount: sortedAppointments.length,
  };
}
