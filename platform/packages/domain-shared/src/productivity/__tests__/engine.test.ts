import { BarberProductivityEngine } from '../engine';

describe('BarberProductivityEngine', () => {
  const engine = new BarberProductivityEngine();

  test('calculates chair utilization and idle gaps correctly', () => {
    const result = engine.calculateChairUtilization([
      {
        barberId: 'barber-1',
        chairId: 'chair-A',
        date: '2026-11-11',
        totalWorkingMinutes: 480,
        bookedServiceMinutes: 384,
        idleGaps: [{ start: '12:00', end: '12:30', durationMinutes: 30 }],
        walkInCount: 2,
      },
    ]);

    expect(result.averageUtilizationRate).toBe(0.8);
    expect(result.totalIdleMinutes).toBe(30);
    expect(result.peakHourCongestionScore).toBeGreaterThan(0);
    expect(result.dynamicBufferRecommendedMinutes).toBeDefined();
  });

  test('optimizes service durations based on historical actuals', () => {
    const recommendations = engine.optimizeServiceDurations([
      {
        serviceId: 'srv-1',
        serviceName: 'Classic Fade',
        standardDurationMinutes: 30,
        historicalActualDurationsMinutes: [38, 40, 42, 39],
      },
      {
        serviceId: 'srv-2',
        serviceName: 'Quick Beard Trim',
        standardDurationMinutes: 20,
        historicalActualDurationsMinutes: [15, 14, 16],
      },
    ]);

    expect(recommendations[0]?.recommendedMinutes).toBe(35);
    expect(recommendations[1]?.recommendedMinutes).toBe(15);
  });

  test('calculates commission payouts accurately', () => {
    const payout = engine.calculateCommissionPayouts(
      [
        {
          appointmentId: 'app-1',
          barberId: 'barber-1',
          serviceRevenue: 2000,
          retailRevenue: 500,
          tips: 300,
          utilizationRate: 0.85,
        },
      ],
      {
        baseCommissionPct: 50,
        retailBonusPct: 15,
        utilizationBonusThresholdPct: 0.8,
        utilizationBonusPct: 5,
      },
      0.85
    );

    expect(payout.baseCommissionAmount).toBe(1000);
    expect(payout.retailBonusAmount).toBe(75);
    expect(payout.utilizationBonusAmount).toBe(100);
    expect(payout.totalTips).toBe(300);
    expect(payout.totalPayout).toBe(1475);
    expect(payout.commissionTier).toBe('gold');
    expect(payout.projectedAnnualEarnings).toBe(1475 * 52);
  });
});
