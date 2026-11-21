/**
 * FADE Barber Chair Turnover & Pacing Optimizer
 * Optimizes chair turnover efficiency, pacing intervals, and fatigue mitigation
 * for high-density barber shop operations.
 */

export interface TurnoverContext {
  chairId: string;
  barberId: string;
  completedAppointmentsCount: number;
  totalOperatingHours: number;
  consecutiveWorkingHoursWithoutBreak: number;
  averageClientTurnoverMinutes: number;
  punctualityScore: number; // 0.0 to 1.0
}

export interface TurnoverOptimizationResult {
  chairId: string;
  barberId: string;
  turnoverRatePerHour: number;
  fatigueIndex: number; // 0.0 (fresh) to 1.0 (exhausted)
  recommendedPacingAdjustmentMinutes: number;
  requiresMicroBreak: boolean;
  microBreakDurationMinutes: number;
  efficiencyGrade: 'A+' | 'A' | 'B' | 'C' | 'Needs Pacing';
}

export class BarberTurnoverPacingOptimizer {
  /**
   * Optimizes chair turnover and recommends pacing adjustments.
   */
  optimizeTurnover(context: TurnoverContext): TurnoverOptimizationResult {
    const hours = Math.max(0.1, context.totalOperatingHours);
    const turnoverRatePerHour = Number((context.completedAppointmentsCount / hours).toFixed(2));

    // Fatigue index scales with consecutive working hours without break (peaks at 4+ hours)
    const fatigueIndex = Number(
      Math.min(1.0, context.consecutiveWorkingHoursWithoutBreak / 4.0).toFixed(2)
    );

    let recommendedPacingAdjustmentMinutes = 0;
    let requiresMicroBreak = false;
    let microBreakDurationMinutes = 0;

    if (fatigueIndex >= 0.75) {
      requiresMicroBreak = true;
      microBreakDurationMinutes = 15;
      recommendedPacingAdjustmentMinutes = 5;
    } else if (fatigueIndex >= 0.5) {
      recommendedPacingAdjustmentMinutes = 3;
    }

    // Adjust for punctuality
    if (context.punctualityScore < 0.8) {
      recommendedPacingAdjustmentMinutes += 2;
    }

    let efficiencyGrade: TurnoverOptimizationResult['efficiencyGrade'] = 'A+';
    if (turnoverRatePerHour < 1.0 || fatigueIndex > 0.8) {
      efficiencyGrade = 'Needs Pacing';
    } else if (turnoverRatePerHour >= 2.0 && fatigueIndex < 0.5) {
      efficiencyGrade = 'A+';
    } else if (turnoverRatePerHour >= 1.5) {
      efficiencyGrade = 'A';
    } else if (turnoverRatePerHour >= 1.2) {
      efficiencyGrade = 'B';
    } else {
      efficiencyGrade = 'C';
    }

    return {
      chairId: context.chairId,
      barberId: context.barberId,
      turnoverRatePerHour,
      fatigueIndex,
      recommendedPacingAdjustmentMinutes,
      requiresMicroBreak,
      microBreakDurationMinutes,
      efficiencyGrade,
    };
  }
}
