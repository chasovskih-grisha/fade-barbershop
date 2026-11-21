import type { BarberPerformanceData } from './barber-performance-types';

const FALLBACK: BarberPerformanceData = {
  appointmentsCount: 42,
  revenue: 35000,
  avgCheck: 833,
  utilizationRate: 0.78,
  commissionTier: 'silver',
  bonusMultiplier: 1.1,
  recommendedAction: 'Оптимальне завантаження: стабільний графік',
  idleGapsMinutes: [{ start: '13:00', end: '13:45', durationMinutes: 45 }],
  vacationRequests: [
    {
      id: 'v-1',
      startDate: '2026-12-01',
      endDate: '2026-12-07',
      reason: 'Відпустка',
      status: 'approved',
    },
  ],
};

/** API може повернути частковий DTO — секція не має падати через відсутні масиви. */
export function normalizeBarberPerformance(
  raw: Partial<BarberPerformanceData> | null | undefined
): BarberPerformanceData {
  return {
    appointmentsCount: raw?.appointmentsCount ?? FALLBACK.appointmentsCount,
    revenue: raw?.revenue ?? FALLBACK.revenue,
    avgCheck: raw?.avgCheck ?? FALLBACK.avgCheck,
    utilizationRate: raw?.utilizationRate ?? FALLBACK.utilizationRate,
    commissionTier: raw?.commissionTier ?? FALLBACK.commissionTier,
    bonusMultiplier: raw?.bonusMultiplier ?? FALLBACK.bonusMultiplier,
    recommendedAction: raw?.recommendedAction ?? FALLBACK.recommendedAction,
    idleGapsMinutes: raw?.idleGapsMinutes ?? FALLBACK.idleGapsMinutes,
    vacationRequests: raw?.vacationRequests ?? FALLBACK.vacationRequests,
  };
}
