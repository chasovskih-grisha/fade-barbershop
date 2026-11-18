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
    const recs = engine.optimizeServiceDurations([
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

    expect(recs[0]?.recommendedMinutes).toBe(35);
    expect(recs[1]?.recommendedMinutes).toBe(15);
  });

  test('calculates commission payouts accurately', () => {
    const payout = engine.calculateCommissionPayouts(
      [
        { appointmentId: 'app-1', barberId: 'barber-1', serviceRevenue: 2000, retailRevenue: 500, tips: 300, utilizationRate: 0.85 },
      ],
      { baseCommissionPct: 50, retailBonusPct: 15, utilizationBonusThresholdPct: 0.80, utilizationBonusPct: 5 },
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

  test('generates full productivity report', () => {
    const report = engine.generateProductivityReport({
      barberId: 'barber-1',
      chairRecords: [
        {
          barberId: 'barber-1',
          chairId: 'chair-1',
          date: '2026-11-11',
          totalWorkingMinutes: 480,
          bookedServiceMinutes: 400,
          idleGaps: [],
          walkInCount: 1,
        },
      ],
      serviceRecords: [
        { serviceId: 's1', serviceName: 'Fade', standardDurationMinutes: 30, historicalActualDurationsMinutes: [30, 31] },
      ],
      appointments: [
        { appointmentId: 'a1', barberId: 'barber-1', serviceRevenue: 3000, retailRevenue: 0, tips: 200, utilizationRate: 0.83 },
      ],
      commissionConfig: { baseCommissionPct: 45, retailBonusPct: 10, utilizationBonusThresholdPct: 0.80, utilizationBonusPct: 5 },
    });

    expect(report.barberId).toBe('barber-1');
    expect(report.overallScore).toBeGreaterThan(50);
    expect(report.payoutSummary.totalPayout).toBeGreaterThan(0);
    expect(report.productivityBadge).toBeDefined();
  });
});
