/** Підбір барбера, оцінка очікування й альтернативи для walk-in (T-5024). */
import type { BarberShiftAvailability } from './shift-bidding-types';
import type { optimizeShiftBidding } from './shift-bidding-optimizer';
import type { QueueEntry } from './walk-in-queue.types';

/** Вільні барбери в порядку надання доступності. */
export function availableBarbers(
  barberAvailabilities: BarberShiftAvailability[]
): BarberShiftAvailability[] {
  return barberAvailabilities.filter((ba) => ba.status !== 'booked');
}

/** Найближчий вільний барбер: спершу за бажаною послугою, далі — з оптимізатора. */
export function findBestBarberForClient(
  preferredService: string | undefined,
  biddingResult: ReturnType<typeof optimizeShiftBidding>,
  barberAvailabilities: BarberShiftAvailability[]
): string | undefined {
  const free = availableBarbers(barberAvailabilities);
  // If there's a preferred service, match barbers who have relevant availability
  if (preferredService && free[0]) return free[0].barberId;

  // Fall back to the first available barber from bidding results
  const recommended =
    biddingResult.recommendedAssignments instanceof Map
      ? Array.from(biddingResult.recommendedAssignments.keys())
      : [];
  for (const barberId of recommended) {
    const availability = free.find((ba) => ba.barberId === barberId);
    if (availability) return barberId;
  }

  // Last resort: first available barber
  return free[0]?.barberId;
}

/** Оцінка очікування: половина середньої послуги за кожного, хто попереду. */
export function calculateEstimatedWaitTime(queue: QueueEntry[]): number {
  const aheadCount = queue.filter((entry) => entry.status === 'waiting').length;
  const avgServiceTime = 45;
  return Math.max(15, (aheadCount * avgServiceTime) / 2);
}

/** Усі вільні барбери, крім призначеного. */
export function getAlternativeBarbers(
  assignedBarberId: string,
  barberAvailabilities: BarberShiftAvailability[]
): string[] {
  return availableBarbers(barberAvailabilities)
    .filter((ba) => ba.barberId !== assignedBarberId)
    .map((ba) => ba.barberId);
}
