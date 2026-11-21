import { optimizeBarberWorkloadBalance } from './barber-workload-balance-optimizer';

describe('BarberWorkloadBalanceOptimizer', () => {
  it('identifies critical fatigue risk and suggests walk-in redirection', () => {
    const result = optimizeBarberWorkloadBalance({
      barbers: [
        {
          barberId: 'b1',
          name: 'Alex Fade',
          scheduledMinutes: 420,
          maxCapacityMinutes: 480,
          consecutiveBookedMinutes: 270,
          breakMinutes: 15,
        },
        {
          barberId: 'b2',
          name: 'Sam Shear',
          scheduledMinutes: 180,
          maxCapacityMinutes: 480,
          consecutiveBookedMinutes: 90,
          breakMinutes: 60,
        },
      ],
    });

    expect(result.busiestBarberId).toBe('b1');
    expect(result.underutilizedBarberIds).toContain('b2');
    expect(result.recommendations.find((r) => r.barberId === 'b1')?.fatigueRiskLevel).toBe(
      'critical'
    );
    expect(result.recommendations.find((r) => r.barberId === 'b1')?.suggestWalkInRedirection).toBe(
      true
    );
    expect(result.recommendations.find((r) => r.barberId === 'b2')?.utilizationRate).toBe(0.38);
  });

  it('handles empty barbers array gracefully', () => {
    const result = optimizeBarberWorkloadBalance({ barbers: [] });
    expect(result.averageUtilization).toBe(0);
    expect(result.recommendations).toHaveLength(0);
    expect(result.busiestBarberId).toBe('');
  });
});
