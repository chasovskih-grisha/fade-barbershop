// Порт джерела даних дашборда запуску (T-4439). Use case не знає ні Prisma,
// ні in-process лічильників: тести підставляють фейк, прод — Prisma-адаптер.
import type { LaunchCounters } from '../domain/launch-dashboard';

export const LAUNCH_METRICS_SOURCE = 'LAUNCH_METRICS_SOURCE';

export interface LaunchMetricsSource {
  /** Лічильники за вікно [from, to]; локації — снапшот на момент запиту. */
  countersBetween(from: Date, to: Date): Promise<LaunchCounters>;
}
