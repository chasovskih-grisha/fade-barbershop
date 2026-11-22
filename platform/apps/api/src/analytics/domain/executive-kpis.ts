/** Executive KPI computation for drill-down dashboards (T-5013). */

export type KpiDimension = 'location' | 'barber' | 'service' | 'period' | 'network';

/** Aggregated operational facts for one dimension value and period. */
export interface KpiSnapshot {
  readonly dimension: KpiDimension;
  readonly key: string;
  readonly chairHoursAvailable: number;
  readonly chairHoursBooked: number;
  readonly revenueMinor: number;
  readonly completedAppointments: number;
  readonly rebookedAppointments: number;
  /** Clients active at the start of the period. */
  readonly clientsAtStart: number;
  readonly clientsRetained: number;
  readonly npsPromoters: number;
  readonly npsPassives: number;
  readonly npsDetractors: number;
}

export interface ExecutiveKpis {
  readonly dimension: KpiDimension;
  readonly key: string;
  readonly revParMinor: number;
  readonly utilisationRate: number;
  readonly rebookingRate: number;
  readonly churnRate: number;
  readonly averageOrderValueMinor: number;
  /** Net Promoter Score on a -100..100 scale. */
  readonly nps: number;
}

function ratio(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0;
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function computeExecutiveKpis(snapshot: KpiSnapshot): ExecutiveKpis {
  const responses = snapshot.npsPromoters + snapshot.npsPassives + snapshot.npsDetractors;
  const churnRate = snapshot.clientsAtStart > 0
    ? 1 - ratio(snapshot.clientsRetained, snapshot.clientsAtStart)
    : 0;
  const nps = responses > 0
    ? roundTo(((snapshot.npsPromoters - snapshot.npsDetractors) / responses) * 100, 1)
    : 0;
  return {
    dimension: snapshot.dimension,
    key: snapshot.key,
    revParMinor: Math.round(ratio(snapshot.revenueMinor, snapshot.chairHoursAvailable)),
    utilisationRate: roundTo(ratio(snapshot.chairHoursBooked, snapshot.chairHoursAvailable), 4),
    rebookingRate: roundTo(
      ratio(snapshot.rebookedAppointments, snapshot.completedAppointments),
      4
    ),
    churnRate: roundTo(churnRate, 4),
    averageOrderValueMinor: Math.round(
      ratio(snapshot.revenueMinor, snapshot.completedAppointments)
    ),
    nps,
  };
}

/** Rolls dimension slices into a network row; rates are recomputed, never averaged. */
export function aggregateKpis(snapshots: readonly KpiSnapshot[]): ExecutiveKpis {
  const total = snapshots.reduce<KpiSnapshot>(
    (sum, snapshot) => ({
      dimension: 'network',
      key: 'network',
      chairHoursAvailable: sum.chairHoursAvailable + snapshot.chairHoursAvailable,
      chairHoursBooked: sum.chairHoursBooked + snapshot.chairHoursBooked,
      revenueMinor: sum.revenueMinor + snapshot.revenueMinor,
      completedAppointments: sum.completedAppointments + snapshot.completedAppointments,
      rebookedAppointments: sum.rebookedAppointments + snapshot.rebookedAppointments,
      clientsAtStart: sum.clientsAtStart + snapshot.clientsAtStart,
      clientsRetained: sum.clientsRetained + snapshot.clientsRetained,
      npsPromoters: sum.npsPromoters + snapshot.npsPromoters,
      npsPassives: sum.npsPassives + snapshot.npsPassives,
      npsDetractors: sum.npsDetractors + snapshot.npsDetractors,
    }),
    {
      dimension: 'network',
      key: 'network',
      chairHoursAvailable: 0,
      chairHoursBooked: 0,
      revenueMinor: 0,
      completedAppointments: 0,
      rebookedAppointments: 0,
      clientsAtStart: 0,
      clientsRetained: 0,
      npsPromoters: 0,
      npsPassives: 0,
      npsDetractors: 0,
    }
  );
  return computeExecutiveKpis(total);
}

/** Drill-down helper: keeps slices for one dimension and orders by revenue. */
export function drillDown(
  snapshots: readonly KpiSnapshot[],
  dimension: KpiDimension
): ExecutiveKpis[] {
  return snapshots
    .filter((snapshot) => snapshot.dimension === dimension)
    .map(computeExecutiveKpis)
    .sort((left, right) => right.revParMinor - left.revParMinor);
}
