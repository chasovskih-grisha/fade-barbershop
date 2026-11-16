import { BarberProductivityEngine, ChairUtilizationRecord, ServiceDurationEstimate, CommissionPayoutItem } from '../src/index';

describe('BarberProductivityEngine', () => {
  const engine = new BarberProductivityEngine();

  test('calculates chair utilization and efficiency score accurately', () => {
    const record: ChairUtilizationRecord = {
      barberId: 'barber-1',
      chairId: 'chair-02',
      date: '2026-11-20',
      totalMinutesAvailable: 480, // 8 hours
      totalMinutesBooked: 360,     // 6 hours
      walkInMinutesBooked: 45,     // 45 mins walk-ins
      breakMinutes: 45             // 45 mins break
    };

    // Active working minutes = 480 - 45 = 435 mins
    // Total booked = 360 + 45 = 405 mins
    // Utilization rate = (405 / 435) * 100 = 93.10%
    const res = engine.calculateChairUtilization(record);
    expect(res.utilizationRate).toBe(93.1);
    expect(res.idleMinutes).toBe(30);
    expect(res.efficiencyScore).toBe('Elite / High Demand');
  });

  test('optimizes service duration based on historical telemetry', () => {
    const estimate: ServiceDurationEstimate = {
      serviceId: 'fade-haircut',
      serviceName: 'Signature Fade & Styling',
      baseDurationMinutes: 30,
      historicalAverageMinutes: 33.5,
      adjustmentFactor: 1.05 // slightly longer execution observed
    };

    // 33.5 * 1.05 = 35.175 -> rounded to nearest 5 = 35 mins
    const res = engine.optimizeServiceDuration(estimate);
    expect(res.recommendedDurationMinutes).toBe(35);
    expect(res.varianceMinutes).toBe(5);
  });

  test('calculates commission and payout with retail commission and rental fee', () => {
    const item: CommissionPayoutItem = {
      barberId: 'barber-1',
      barberName: 'Marcus Vance',
      serviceRevenue: 1200,
      productRevenue: 300,
      tipTotal: 250,
      baseCommissionRate: 0.55, // 55% service commission
      retailCommissionRate: 0.15, // 15% retail commission
      chairRentalFee: 150,
      bonusMultiplier: 1.1 // 10% performance bonus on services
    };

    // Service commission = 1200 * 0.55 * 1.1 = 726.0
    // Retail commission = 300 * 0.15 = 45.0
    // Gross earnings = 726 + 45 + 250 = 1021.0
    // Final payout = 1021 - 150 = 871.0
    const res = engine.calculateCommissionPayout(item);
    expect(res.netCommission).toBe(1021);
    expect(res.finalPayout).toBe(871);
  });

  test('optimizes schedule gaps to minimize idle time', () => {
    const gaps = [
      { slotStart: '10:00', durationMinutes: 20 },
      { slotStart: '12:30', durationMinutes: 45 },
      { slotStart: '14:15', durationMinutes: 30 }
    ];

    // Target service duration: 30 mins
    // Gaps >= 30: 12:30 (45 mins, remainder 15), 14:15 (30 mins, remainder 0)
    // Best fit with minimal remainder is 14:15 (remainder 0)
    const best = engine.optimizeScheduleGaps(gaps, 30);
    expect(best).not.toBeNull();
    expect(best?.recommendedSlotStart).toBe('14:15');
    expect(best?.gapMinutes).toBe(30);
  });
});
