import { BarberProductivityEngine, ChairUtilizationRecord, ServiceDurationEstimate, CommissionPayoutItem } from '../src/index';

describe('BarberProductivityEngine', () => {
  let engine: BarberProductivityEngine;

  beforeEach(() => {
    engine = new BarberProductivityEngine();
  });

  test('calculates chair utilization and efficiency score correctly', () => {
    const record: ChairUtilizationRecord = {
      barberId: 'b-01',
      chairId: 'c-05',
      date: '2026-11-16',
      totalMinutesAvailable: 480, // 8 hours
      totalMinutesBooked: 360,
      walkInMinutesBooked: 60,
      breakMinutes: 60,
    };

    const result = engine.calculateChairUtilization(record);
    // Active available = 480 - 60 = 420
    // Total booked = 360 + 60 = 420 -> 100% utilization
    expect(result.utilizationRate).toBe(100);
    expect(result.idleMinutes).toBe(0);
    expect(result.efficiencyScore).toBe('Elite / High Demand');
  });

  test('optimizes service duration based on telemetry', () => {
    const estimate: ServiceDurationEstimate = {
      serviceId: 's-fade',
      serviceName: 'Skin Fade',
      baseDurationMinutes: 30,
      historicalAverageMinutes: 32,
      adjustmentFactor: 1.1, // 35.2 mins -> rounds to 35
    };

    const res = engine.optimizeServiceDuration(estimate);
    expect(res.recommendedDurationMinutes).toBe(35);
    expect(res.varianceMinutes).toBe(5);
  });

  test('calculates commission and net payout correctly', () => {
    const item: CommissionPayoutItem = {
      barberId: 'b-01',
      barberName: 'Alex Fade',
      serviceRevenue: 1000,
      productRevenue: 200,
      tipTotal: 150,
      baseCommissionRate: 0.50, // $500
      retailCommissionRate: 0.15, // $30
      chairRentalFee: 100,
      bonusMultiplier: 1.05, // 5% bonus on service commission -> $525
    };

    const payout = engine.calculateCommissionPayout(item);
    // serviceCommission = 1000 * 0.50 * 1.05 = 525
    // retailCommission = 200 * 0.15 = 30
    // gross = 525 + 30 + 150 = 705
    // finalPayout = 705 - 100 = 605
    expect(payout.netCommission).toBe(705);
    expect(payout.finalPayout).toBe(605);
  });

  test('optimizes schedule gaps to minimize idle time', () => {
    const gaps = [
      { slotStart: '10:00', durationMinutes: 20 },
      { slotStart: '11:00', durationMinutes: 45 },
      { slotStart: '13:00', durationMinutes: 30 },
    ];

    const optimal = engine.optimizeScheduleGaps(gaps, 30);
    expect(optimal).not.toBeNull();
    expect(optimal?.recommendedSlotStart).toBe('13:00'); // 30 min gap fits 30 min service with 0 remainder (best fit)
    expect(optimal?.gapMinutes).toBe(30);
  });
});
