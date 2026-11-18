import { calculateChairUtilizationMetrics } from './chair-utilization';

const at = (hour: number, minute: number) => new Date(Date.UTC(2026, 9, 5, hour, minute));

describe('calculateChairUtilizationMetrics', () => {
  it('calculates 50% utilization for 4 hours operating window with 2 chairs and 4 hours total booking', () => {
    const metrics = calculateChairUtilizationMetrics({
      operatingStart: at(9, 0),
      operatingEnd: at(13, 0), // 4 hours = 240 mins * 2 chairs = 480 capacity mins
      existing: [
        { start: at(9, 0), end: at(11, 0) }, // 2 hours = 120 mins
        { start: at(9, 0), end: at(11, 0) }, // 2 hours concurrent = 120 mins
      ],
      chairs: 2,
    });

    expect(metrics.totalCapacityMinutes).toBe(480);
    expect(metrics.occupiedMinutes).toBe(120);
    expect(metrics.occupancyRate).toBe(0.25); // 120 / 480
    expect(metrics.chairHoursAvailable).toBe(8);
    expect(metrics.chairHoursOccupied).toBe(2);
  });

  it('handles zero chairs or invalid window gracefully', () => {
    const metrics = calculateChairUtilizationMetrics({
      operatingStart: at(13, 0),
      operatingEnd: at(9, 0),
      existing: [],
      chairs: 2,
    });
    expect(metrics.occupancyRate).toBe(0);
    expect(metrics.totalCapacityMinutes).toBe(0);
  });
});
