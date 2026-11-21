import { calculateSmartCapacityPayout } from './smart-capacity-payout-optimizer';

const at = (hour: number, minute: number) => new Date(Date.UTC(2026, 9, 10, hour, minute));

describe('FADE Smart Capacity & Payout Optimizer (T-4621)', () => {
  it('rewards high chair occupancy with tier bonus payout multipliers', () => {
    const result = calculateSmartCapacityPayout({
      barberId: 'barber-elite-1',
      operatingStart: at(9, 0),
      operatingEnd: at(17, 0), // 8 hours * 1 chair = 480 capacity mins
      chairs: 1,
      baseCommissionRate: 0.5,
      existingAppointments: [
        { start: at(9, 0), end: at(12, 0), revenue: 300 }, // 180 mins
        { start: at(12, 30), end: at(16, 30), revenue: 400 }, // 240 mins
      ], // total 420 occupied mins out of 480 = 87.5% occupancy
    });

    expect(result.chairOccupancyRate).toBeGreaterThanOrEqual(0.85);
    expect(result.efficiencyGrade).toBe('A+');
    expect(result.tierBonusMultiplier).toBe(1.25);
    expect(result.smartCommissionRate).toBe(0.625); // 50% * 1.25
    expect(result.finalPayoutAmount).toBe(700 * 0.625); // 437.5
  });

  it('applies standard payout for low chair occupancy', () => {
    const result = calculateSmartCapacityPayout({
      barberId: 'barber-spare-2',
      operatingStart: at(9, 0),
      operatingEnd: at(17, 0),
      chairs: 1,
      baseCommissionRate: 0.5,
      existingAppointments: [{ start: at(10, 0), end: at(12, 0), revenue: 150 }], // 120 mins out of 480 = 25% occupancy
    });

    expect(result.chairOccupancyRate).toBe(0.25);
    expect(result.efficiencyGrade).toBe('D');
    expect(result.tierBonusMultiplier).toBe(1.0);
    expect(result.finalPayoutAmount).toBe(75);
  });
});
