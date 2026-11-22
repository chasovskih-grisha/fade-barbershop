import { buildCohortRetention, cohortKey } from './cohort-retention';
import { predictLtv } from './ltv';

describe('buildCohortRetention (T-5025)', () => {
  it('groups clients by acquisition month and computes retention rates', () => {
    const cohorts = buildCohortRetention([
      { clientId: 'c1', acquiredAt: new Date('2026-01-10T00:00:00Z'), activeMonths: [0, 1, 2] },
      { clientId: 'c2', acquiredAt: new Date('2026-01-20T00:00:00Z'), activeMonths: [0, 2] },
      { clientId: 'c3', acquiredAt: new Date('2026-02-02T00:00:00Z'), activeMonths: [0, 1] },
    ]);

    expect(cohorts.map((row) => row.cohort)).toEqual(['2026-01', '2026-02']);
    expect(cohorts[0]).toEqual({
      cohort: '2026-01',
      size: 2,
      retainedByMonth: [2, 1, 2],
      retentionRateByMonth: [1, 0.5, 1],
    });
    expect(cohorts[1]?.retentionRateByMonth).toEqual([1, 1]);
  });

  it('handles an empty cohort list and pads month keys', () => {
    expect(buildCohortRetention([])).toEqual([]);
    expect(cohortKey(new Date('2026-03-31T23:00:00Z'))).toBe('2026-03');
  });
});

describe('predictLtv (T-5025)', () => {
  it('projects decaying 12-month value from observed spend', () => {
    const estimate = predictLtv(
      {
        clientId: 'c1',
        first30DayVisits: 2,
        first30DaySpendMinor: 60_000,
        totalVisits: 4,
        totalSpendMinor: 120_000,
      },
      25_000
    );

    // 2 visits/month * 30 000 minor average * sum(0.85^0..11)
    expect(estimate.predicted12MonthValueMinor).toBe(343_103);
    expect(estimate.projectedMonthlyVisits).toBe(2);
    expect(estimate.confidence).toBe('medium');
  });

  it('falls back to the shop average and low confidence for a single visit', () => {
    const estimate = predictLtv(
      {
        clientId: 'c2',
        first30DayVisits: 1,
        first30DaySpendMinor: 10_000,
        totalVisits: 0,
        totalSpendMinor: 0,
      },
      20_000
    );

    expect(estimate.projectedMonthlyVisits).toBe(1);
    expect(estimate.confidence).toBe('low');
    expect(estimate.predicted12MonthValueMinor).toBe(114_368);
  });
});
