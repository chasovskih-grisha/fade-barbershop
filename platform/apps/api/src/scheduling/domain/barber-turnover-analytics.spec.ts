import { analyzeBarberTurnoverAnalytics } from './barber-turnover-analytics';

const at = (hour: number, minute: number) => new Date(Date.UTC(2026, 9, 15, hour, minute));

describe('FADE Barber Turnover Analytics Report (T-4623)', () => {
  it('computes location chair turnover, occupancy, and aggregate commission payouts', () => {
    const report = analyzeBarberTurnoverAnalytics({
      locationId: 'CLT-01',
      operatingStart: at(9, 0),
      operatingEnd: at(17, 0), // 8 hours
      chairsCount: 2,
      barbers: [
        {
          barberId: 'barber-1',
          name: 'Alex Fade',
          baseCommissionRate: 0.5,
          appointments: [
            { start: at(9, 0), end: at(12, 0), revenue: 300, serviceName: 'Fade & Beard' },
            { start: at(13, 0), end: at(17, 0), revenue: 500, serviceName: 'Executive Grooming' },
          ],
        },
        {
          barberId: 'barber-2',
          name: 'Max Clipper',
          baseCommissionRate: 0.45,
          appointments: [
            { start: at(10, 0), end: at(14, 0), revenue: 350, serviceName: 'Classic Cut' },
          ],
        },
      ],
    });

    expect(report.locationId).toBe('CLT-01');
    expect(report.totalOperatingHours).toBe(8);
    expect(report.totalCapacityMinutes).toBe(960); // 8h * 60m * 2 chairs
    expect(report.totalOccupiedMinutes).toBe(180 + 240 + 240); // 660 mins
    expect(report.locationOccupancyRate).toBeCloseTo(660 / 960, 3);
    expect(report.totalRevenue).toBe(1150);
    expect(report.averageRevenuePerChairHour).toBeCloseTo(1150 / 16, 2); // 16 chair-hours
    expect(report.barberPerformance.length).toBe(2);
    expect(report?.barberPerformance?.[0]?.barberId).toBe('barber-1');
    expect(report?.barberPerformance?.[1]?.barberId).toBe('barber-2');
  });
});
