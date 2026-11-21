import type { ExtendedAppointment } from '@/lib/booking-contract';

// Та сама група «Минулі», що на екрані візитів (T-4734c).
const PAST: ReadonlySet<ExtendedAppointment['status']> = new Set(['completed', 'cancelled']);

/** Кількість минулих візитів зі списку, який кабінет уже вантажить (T-4734). */
export function countPastVisits(list: ExtendedAppointment[]): number {
  return list.filter((visit) => PAST.has(visit.status)).length;
}

/** Рядок під іменем: нуль видимий, а не прихований. */
export function formatVisitCount(count: number): string {
  return `Візитів: ${count}`;
}
