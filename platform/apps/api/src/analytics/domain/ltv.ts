/** Predictive 12-month client lifetime value from first-30-day activity (T-5025). */

export interface ClientActivity {
  readonly clientId: string;
  readonly first30DayVisits: number;
  readonly first30DaySpendMinor: number;
  readonly totalVisits: number;
  readonly totalSpendMinor: number;
}

export type LtvConfidence = 'low' | 'medium' | 'high';

export interface LtvEstimate {
  readonly clientId: string;
  readonly predicted12MonthValueMinor: number;
  readonly projectedMonthlyVisits: number;
  readonly confidence: LtvConfidence;
}

/** Monthly retention decay applied to the projected visit stream. */
const MONTHLY_RETENTION = 0.85;

function confidenceFor(visits: number): LtvConfidence {
  if (visits >= 3) return 'high';
  if (visits >= 2) return 'medium';
  return 'low';
}

function expectedMonthlyVisits(first30DayVisits: number): number {
  return Math.max(0.5, Math.round(first30DayVisits * 10) / 10);
}

function geometricSum(months: number, retention: number): number {
  return (1 - retention ** months) / (1 - retention);
}

/**
 * Projects spend as monthly visit value times a decaying retention curve.
 * The heuristic is intentionally conservative: low-activity clients get one
 * half visit per month rather than an unbounded extrapolation.
 */
export function predictLtv(
  activity: ClientActivity,
  averageSpendMinor: number
): LtvEstimate {
  const observedAverage = activity.totalVisits > 0
    ? activity.totalSpendMinor / activity.totalVisits
    : averageSpendMinor;
  const monthlyVisits = expectedMonthlyVisits(activity.first30DayVisits);
  const predicted = Math.round(
    monthlyVisits * observedAverage * geometricSum(12, MONTHLY_RETENTION)
  );
  return {
    clientId: activity.clientId,
    predicted12MonthValueMinor: Math.max(0, predicted),
    projectedMonthlyVisits: monthlyVisits,
    confidence: confidenceFor(activity.first30DayVisits),
  };
}
