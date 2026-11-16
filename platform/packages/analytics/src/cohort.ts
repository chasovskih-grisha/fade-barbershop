export interface CohortData {
  cohortName: string;
  periodCount: number;
  retentionRates: number[]; // Percentage of users retained per period (e.g. Day 1, Day 7, Day 30)
}

export class CohortRetentionAnalyzer {
  public static calculateRetention(
    cohortName: string,
    initialUsers: number,
    activeUsersPerPeriod: number[]
  ): CohortData {
    if (initialUsers <= 0) {
      return {
        cohortName,
        periodCount: activeUsersPerPeriod.length,
        retentionRates: activeUsersPerPeriod.map(() => 0),
      };
    }

    const retentionRates = activeUsersPerPeriod.map((active) => {
      const rate = (active / initialUsers) * 100;
      return parseFloat(Math.min(100, Math.max(0, rate)).toFixed(2));
    });

    return {
      cohortName,
      periodCount: activeUsersPerPeriod.length,
      retentionRates,
    };
  }
}
