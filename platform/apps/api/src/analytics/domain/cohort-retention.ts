/** Acquisition-cohort retention curves (T-5025). */

export interface ClientCohortMember {
  readonly clientId: string;
  readonly acquiredAt: Date;
  /** Months since acquisition (0 = acquisition month) in which the client visited. */
  readonly activeMonths: readonly number[];
}

export interface CohortRetention {
  readonly cohort: string;
  readonly size: number;
  readonly retainedByMonth: readonly number[];
  readonly retentionRateByMonth: readonly number[];
}

export function cohortKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function retentionRow(
  cohort: string,
  group: readonly ClientCohortMember[]
): CohortRetention {
  const lastMonth = Math.max(0, ...group.flatMap((member) => member.activeMonths));
  const retained = Array.from({ length: lastMonth + 1 }, (_, month) =>
    group.filter((member) => member.activeMonths.includes(month)).length
  );
  return {
    cohort,
    size: group.length,
    retainedByMonth: retained,
    retentionRateByMonth: retained.map((count) =>
      Math.round((count / group.length) * 1000) / 1000
    ),
  };
}

/** Groups clients by acquisition month and returns curves sorted by cohort. */
export function buildCohortRetention(
  members: readonly ClientCohortMember[]
): CohortRetention[] {
  const cohorts = new Map<string, ClientCohortMember[]>();
  for (const member of members) {
    const key = cohortKey(member.acquiredAt);
    cohorts.set(key, [...(cohorts.get(key) ?? []), member]);
  }
  return [...cohorts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([cohort, group]) => retentionRow(cohort, group));
}
