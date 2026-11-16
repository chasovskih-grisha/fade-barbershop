import { CohortRetentionAnalyzer } from '../src/cohort';

describe('CohortRetentionAnalyzer', () => {
  it('should calculate retention rates accurately', () => {
    const cohort = CohortRetentionAnalyzer.calculateRetention('November 2026', 1000, [1000, 750, 500, 250]);
    expect(cohort.cohortName).toBe('November 2026');
    expect(cohort.periodCount).toBe(4);
    expect(cohort.retentionRates).toEqual([100, 75, 50, 25]);
  });

  it('should handle zero initial users gracefully', () => {
    const cohort = CohortRetentionAnalyzer.calculateRetention('Empty Cohort', 0, [10, 5]);
    expect(cohort.retentionRates).toEqual([0, 0]);
  });
});
