import { BarberProductivityEngine, BarberProfile } from '../src/index';

describe('BarberProductivityEngine', () => {
  it('calculates chair utilization and payouts correctly', () => {
    const barbers: BarberProfile[] = [
      { id: 'b1', name: 'Alex Fade', chairId: 'chair-1', efficiencyRating: 1.2, defaultCommissionRate: 0.6 }
    ];

    const engine = new BarberProductivityEngine(barbers);

    engine.registerAppointment({
      id: 'a1',
      barberId: 'b1',
      serviceName: 'Fade & Beard Trim',
      baseDurationMinutes: 45,
      price: 50,
      completed: true
    });

    const utilization = engine.calculateChairUtilization('chair-1', 480);
    expect(utilization.bookedMinutes).toBe(38);

    const payout = engine.calculatePayout('b1');
    expect(payout.totalSales).toBe(50);
    expect(payout.payoutAmount).toBe(30);
  });
});
