export interface CohortData {
  cohortMonth: string;
  initialUsers: number;
  month0: number; // 100%
  month1: number; // %
  month2: number; // %
  month3: number; // %
}

export const COHORTS: CohortData[] = [
  {
    cohortMonth: 'Жовтень 2026',
    initialUsers: 1420,
    month0: 100,
    month1: 68,
    month2: 54,
    month3: 49,
  },
  {
    cohortMonth: 'Вересень 2026',
    initialUsers: 1280,
    month0: 100,
    month1: 65,
    month2: 52,
    month3: 46,
  },
  {
    cohortMonth: 'Серпень 2026',
    initialUsers: 1150,
    month0: 100,
    month1: 62,
    month2: 48,
    month3: 42,
  },
];
