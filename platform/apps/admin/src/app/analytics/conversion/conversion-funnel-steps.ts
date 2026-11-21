export interface FunnelStepData {
  stepNumber: number;
  stepName: string;
  usersCount: number;
  conversionRate: number;
  dropOffRate: number;
  avgDurationSeconds: number;
}

export type DeviceFilter = 'all' | 'mobile' | 'web';

const BASE_STEPS: Array<Omit<FunnelStepData, 'usersCount'> & Record<DeviceFilter, number>> = [
  {
    stepNumber: 1,
    stepName: 'Перегляд головної / Послуг (Landing View)',
    conversionRate: 100,
    dropOffRate: 0,
    avgDurationSeconds: 18,
    all: 14600,
    mobile: 8400,
    web: 6200,
  },
  {
    stepNumber: 2,
    stepName: 'Вибір майстра (Barber Selection)',
    conversionRate: 77.9,
    dropOffRate: 22.1,
    avgDurationSeconds: 42,
    all: 11370,
    mobile: 6720,
    web: 4650,
  },
  {
    stepNumber: 3,
    stepName: 'Вибір часу (Slot & Calendar Selection)',
    conversionRate: 57.7,
    dropOffRate: 25.8,
    avgDurationSeconds: 55,
    all: 8430,
    mobile: 5120,
    web: 3310,
  },
  {
    stepNumber: 4,
    stepName: 'Авторизація та телефон (Auth & PIN / Phone)',
    conversionRate: 49.7,
    dropOffRate: 13.9,
    avgDurationSeconds: 28,
    all: 7260,
    mobile: 4480,
    web: 2780,
  },
  {
    stepNumber: 5,
    stepName: 'Підтвердження та сплата (Booking Commit)',
    conversionRate: 43.4,
    dropOffRate: 12.8,
    avgDurationSeconds: 15,
    all: 6330,
    mobile: 3920,
    web: 2410,
  },
];

export function funnelSteps(filter: DeviceFilter): FunnelStepData[] {
  return BASE_STEPS.map(({ all, mobile, web, ...step }) => ({
    ...step,
    usersCount: filter === 'all' ? all : filter === 'mobile' ? mobile : web,
  }));
}

export function heatmapTone(dropOff: number): string {
  if (dropOff > 20) return 'bg-semantic-danger/15 text-semantic-danger border-semantic-danger/30';
  if (dropOff > 12)
    return 'bg-semantic-warning/15 text-semantic-warning border-semantic-warning/30';
  return 'bg-semantic-success/15 text-semantic-success border-semantic-success/30';
}
