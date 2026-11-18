import { BarberTurnoverPacingOptimizer, TurnoverContext } from './barber-turnover-pacing-optimizer';

describe('BarberTurnoverPacingOptimizer', () => {
  let optimizer: BarberTurnoverPacingOptimizer;

  beforeEach(() => {
    optimizer = new BarberTurnoverPacingOptimizer();
  });

  it('should calculate high efficiency grade for fresh barber with high turnover', () => {
    const context: TurnoverContext = {
      chairId: 'chair-1',
      barberId: 'barber-alex',
      completedAppointmentsCount: 8,
      totalOperatingHours: 4,
      consecutiveWorkingHoursWithoutBreak: 1,
      averageClientTurnoverMinutes: 30,
      punctualityScore: 0.95,
    };

    const result = optimizer.optimizeTurnover(context);

    expect(result.turnoverRatePerHour).toBe(2.0);
    expect(result.fatigueIndex).toBe(0.25);
    expect(result.requiresMicroBreak).toBe(false);
    expect(result.efficiencyGrade).toBe('A+');
  });

  it('should recommend micro-break and pacing adjustment for fatigued barber', () => {
    const context: TurnoverContext = {
      chairId: 'chair-2',
      barberId: 'barber-max',
      completedAppointmentsCount: 12,
      totalOperatingHours: 5,
      consecutiveWorkingHoursWithoutBreak: 4,
      averageClientTurnoverMinutes: 25,
      punctualityScore: 0.85,
    };

    const result = optimizer.optimizeTurnover(context);

    expect(result.fatigueIndex).toBe(1.0);
    expect(result.requiresMicroBreak).toBe(true);
    expect(result.microBreakDurationMinutes).toBe(15);
    expect(result.recommendedPacingAdjustmentMinutes).toBe(5);
  });
});
