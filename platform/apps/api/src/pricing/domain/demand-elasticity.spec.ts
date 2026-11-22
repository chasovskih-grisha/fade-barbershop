import {
  demandIndex,
  estimateElasticity,
  projectRevenueImpact,
  recommendMultiplier,
  utilisationOf,
} from './demand-elasticity';
import type { DemandSignals } from './demand.types';

function signals(overrides: Partial<DemandSignals> = {}): DemandSignals {
  return {
    locationId: 'location-1',
    windowStart: new Date('2026-11-22T18:00:00Z'),
    bookingVelocity: 6,
    baselineVelocity: 4,
    capacityPerHour: 8,
    weatherDemandFactor: 1,
    localEventFactor: 1,
    ...overrides,
  };
}

describe('utilisation and demand index (T-5005)', () => {
  it('clamps utilisation and treats zero capacity as fully booked', () => {
    expect(utilisationOf(4, 8)).toBe(0.5);
    expect(utilisationOf(20, 8)).toBe(1.2);
    expect(utilisationOf(3, 0)).toBe(1);
  });

  it('combines velocity, weather and local events', () => {
    expect(demandIndex(signals())).toBeCloseTo(1.5);
    expect(demandIndex(signals({ weatherDemandFactor: 0.8, localEventFactor: 1.25 })))
      .toBeCloseTo(1.5);
    expect(demandIndex(signals({ baselineVelocity: 0, bookingVelocity: 0 }))).toBe(1);
  });
});

describe('elasticity estimation (T-5005)', () => {
  it('estimates negative arc elasticity from observed points', () => {
    const elasticity = estimateElasticity([
      { multiplierBp: 10_000, velocity: 10 },
      { multiplierBp: 12_000, velocity: 8 },
      { multiplierBp: 14_000, velocity: 6.5 },
    ]);
    expect(elasticity).toBeLessThan(0);
    expect(elasticity).toBeGreaterThan(-2);
  });

  it('defaults to -1 and clamps estimates below -5', () => {
    expect(estimateElasticity([])).toBe(-1);
    expect(estimateElasticity([{ multiplierBp: 10_000, velocity: 0 }])).toBe(-1);
    const extreme = estimateElasticity([
      { multiplierBp: 10_000, velocity: 1_000 },
      { multiplierBp: 10_001, velocity: 1 },
    ]);
    expect(extreme).toBe(-5);
  });
});

describe('recommendMultiplier (T-5005)', () => {
  it('applies no surge off-peak or when demand is at or below baseline', () => {
    expect(recommendMultiplier(signals({ bookingVelocity: 2 })).multiplierBp).toBe(10_000);
    expect(recommendMultiplier(signals({ bookingVelocity: 4 })).multiplierBp).toBe(10_000);
  });

  it('raises price with excess demand and clamps at the safety bound', () => {
    expect(recommendMultiplier(signals()).multiplierBp).toBe(12_500);
    const extreme = recommendMultiplier(
      signals({ bookingVelocity: 12, baselineVelocity: 1, localEventFactor: 2 })
    );
    expect(extreme.multiplierBp).toBe(15_000);
    expect(extreme.clamped).toBe(true);
  });

  it('honours custom safety bounds', () => {
    const recommendation = recommendMultiplier(signals(), {
      minMultiplierBp: 9_000,
      maxMultiplierBp: 11_000,
    });
    expect(recommendation.multiplierBp).toBe(11_000);
    expect(recommendation.clamped).toBe(true);
  });
});

describe('projectRevenueImpact (T-5005)', () => {
  it('projects revenue from elasticity and price multiplier', () => {
    const impact = projectRevenueImpact({
      velocity: 10,
      averagePriceMinor: 20_000,
      multiplierBp: 12_000,
      elasticity: -1,
    });
    expect(impact.baseRevenueMinor).toBe(200_000);
    expect(impact.projectedRevenueMinor).toBe(200_000);
    expect(impact.deltaMinor).toBe(0);
  });

  it('gains on inelastic demand and loses on highly elastic demand', () => {
    const project = (elasticity: number): number =>
      projectRevenueImpact({ velocity: 10, averagePriceMinor: 20_000, multiplierBp: 12_000, elasticity })
        .deltaMinor;
    expect(project(-0.2)).toBeGreaterThan(0);
    expect(project(-3)).toBeLessThan(0);
  });
});
