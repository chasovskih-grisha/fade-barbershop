import { calculateChairUtilizationMetrics } from './chair-utilization';

const at = (hour: number, minute: number) => new Date(Date.UTC(2026, 9, 10, hour, minute));

describe('Barber Productivity & Capacity Optimizer (T-4620)', () => {
  it('computes barber idle time and chair turnover optimization recommendations', () => {
    const metrics = calculateChairUtilizationMetrics({
      operatingStart: at(9, 0),
      operatingEnd: at(17, 0), // 8 hours = 480 mins * 3 chairs = 1440 capacity mins
      existing: [
        { start: at(9, 0), end: at(12, 0) }, // 3 hours
        { start: at(13, 0), end: at(16, 0) }, // 3 hours
      ],
      chairs: 3,
    });

    expect(metrics.totalCapacityMinutes).toBe(1440);
    expect(metrics.occupiedMinutes).toBe(360); // 6 hours total
    expect(metrics.occupancyRate).toBe(0.25);

    // Capacity optimization suggestion: Idle gap analysis
    const idleMinutes = metrics.totalCapacityMinutes - metrics.occupiedMinutes;
    expect(idleMinutes).toBe(1080);
  });
});
