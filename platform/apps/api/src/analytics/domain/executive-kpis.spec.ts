import { aggregateKpis, computeExecutiveKpis, drillDown, type KpiSnapshot } from './executive-kpis';
import { toKpiCsv } from './kpi-report';

function snapshot(overrides: Partial<KpiSnapshot> = {}): KpiSnapshot {
  return {
    dimension: 'location',
    key: 'kyiv',
    chairHoursAvailable: 100,
    chairHoursBooked: 80,
    revenueMinor: 400_000,
    completedAppointments: 40,
    rebookedAppointments: 24,
    clientsAtStart: 50,
    clientsRetained: 40,
    npsPromoters: 30,
    npsPassives: 10,
    npsDetractors: 10,
    ...overrides,
  };
}

describe('computeExecutiveKpis (T-5013)', () => {
  it('computes RevPAR, utilisation, rebooking, churn, AOV and NPS', () => {
    expect(computeExecutiveKpis(snapshot())).toEqual({
      dimension: 'location',
      key: 'kyiv',
      revParMinor: 4_000,
      utilisationRate: 0.8,
      rebookingRate: 0.6,
      churnRate: 0.2,
      averageOrderValueMinor: 10_000,
      nps: 40,
    });
  });

  it('returns zeros instead of dividing by zero and clamps NPS to -100..100', () => {
    const empty = computeExecutiveKpis(
      snapshot({
        chairHoursAvailable: 0,
        chairHoursBooked: 0,
        completedAppointments: 0,
        clientsAtStart: 0,
        npsPromoters: 0,
        npsDetractors: 0,
        npsPassives: 0,
      })
    );
    expect(empty).toMatchObject({
      revParMinor: 0,
      utilisationRate: 0,
      rebookingRate: 0,
      churnRate: 0,
      averageOrderValueMinor: 0,
      nps: 0,
    });
    expect(computeExecutiveKpis(snapshot({ npsPromoters: 0, npsDetractors: 10, npsPassives: 0 })).nps)
      .toBe(-100);
  });
});

describe('aggregateKpis and drillDown (T-5013)', () => {
  it('recomputes network rates from summed facts', () => {
    const network = aggregateKpis([
      snapshot(),
      snapshot({ key: 'lviv', chairHoursAvailable: 50, chairHoursBooked: 25, revenueMinor: 100_000, completedAppointments: 10, rebookedAppointments: 5, clientsAtStart: 10, clientsRetained: 5 }),
    ]);

    expect(network.dimension).toBe('network');
    expect(network.key).toBe('network');
    expect(network.utilisationRate).toBeCloseTo(105 / 150, 4);
    expect(network.rebookingRate).toBeCloseTo(29 / 50, 4);
    expect(network.averageOrderValueMinor).toBe(10_000);
  });

  it('drills into one dimension ordered by RevPAR', () => {
    const rows = drillDown(
      [
        snapshot({ key: 'kyiv' }),
        snapshot({ key: 'lviv', revenueMinor: 100_000 }),
        snapshot({ dimension: 'barber', key: 'ivan' }),
      ],
      'location'
    );
    expect(rows.map((row) => row.key)).toEqual(['kyiv', 'lviv']);
  });
});

describe('toKpiCsv (T-5013)', () => {
  it('emits a header and one row per KPI set, quoting commas', () => {
    const csv = toKpiCsv([
      computeExecutiveKpis(snapshot({ key: 'Kyiv, Center' })),
    ]);
    const [header, first] = csv.split('\n');
    expect(header).toBe(
      'dimension,key,revpar_minor,utilisation_rate,rebooking_rate,churn_rate,average_order_value_minor,nps'
    );
    expect(first).toContain('"Kyiv, Center"');
    expect(first).toContain('4000,0.8,0.6,0.2,10000,40');
  });
});
