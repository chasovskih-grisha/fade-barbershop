import { analyzeBarberCommissionTierProductivity } from './barber-commission-tier-optimizer';

describe('BarberCommissionTierOptimizer', () => {
  it('assigns standard tier and detects idle gaps for low utilization', () => {
    const start = new Date('2026-11-15T09:00:00Z');
    const end = new Date('2026-11-15T17:00:00Z');
    const existing = [
      { start: new Date('2026-11-15T10:00:00Z'), end: new Date('2026-11-15T11:00:00Z') },
    ];

    const result = analyzeBarberCommissionTierProductivity({
      barberId: 'barber-1',
      operatingStart: start,
      operatingEnd: end,
      existing,
      chairs: 1,
    });

    expect(result.barberId).toBe('barber-1');
    expect(result.commissionTier).toBe('standard');
    expect(result.bonusPayoutMultiplier).toBe(1.0);
    expect(result.idleGapsMinutes.length).toBeGreaterThan(0);
    expect(result.recommendedAction).toContain('Low utilization');
  });

  it('assigns platinum tier and bonus multiplier for high utilization', () => {
    const start = new Date('2026-11-15T09:00:00Z');
    const end = new Date('2026-11-15T17:00:00Z');
    const existing = [
      { start: new Date('2026-11-15T09:00:00Z'), end: new Date('2026-11-15T13:00:00Z') },
      { start: new Date('2026-11-15T13:15:00Z'), end: new Date('2026-11-15T17:00:00Z') },
    ];

    const result = analyzeBarberCommissionTierProductivity({
      barberId: 'barber-2',
      operatingStart: start,
      operatingEnd: end,
      existing,
      chairs: 1,
    });

    expect(result.commissionTier).toBe('platinum');
    expect(result.bonusPayoutMultiplier).toBe(1.3);
    expect(result.chairTurnoverEfficiency).toBeGreaterThanOrEqual(0.9);
  });
});
