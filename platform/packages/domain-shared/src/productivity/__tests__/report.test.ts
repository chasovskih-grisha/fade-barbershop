import { BarberProductivityEngine } from '../engine';

describe('BarberProductivityEngine productivity report', () => {
  const engine = new BarberProductivityEngine();

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
        {
          serviceId: 's1',
          serviceName: 'Fade',
          standardDurationMinutes: 30,
          historicalActualDurationsMinutes: [30, 31],
        },
      ],
      appointments: [
        {
          appointmentId: 'a1',
          barberId: 'barber-1',
          serviceRevenue: 3000,
          retailRevenue: 0,
          tips: 200,
          utilizationRate: 0.83,
        },
      ],
      commissionConfig: {
        baseCommissionPct: 45,
        retailBonusPct: 10,
        utilizationBonusThresholdPct: 0.8,
        utilizationBonusPct: 5,
      },
    });

    expect(report.barberId).toBe('barber-1');
    expect(report.overallScore).toBeGreaterThan(50);
    expect(report.payoutSummary.totalPayout).toBeGreaterThan(0);
    expect(report.productivityBadge).toBeDefined();
  });
});
