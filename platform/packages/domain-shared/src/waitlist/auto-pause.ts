import type { WaitlistEntry } from './types';
import { WaitlistStatus } from './types';

function countConsecutiveExpiries(entries: WaitlistEntry[], clientId: string): number {
  const clientEntries = entries
    .filter(
      (entry) =>
        entry.clientId === clientId &&
        entry.status !== WaitlistStatus.PENDING &&
        entry.status !== WaitlistStatus.CONFIRMED
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  let missedCount = 0;
  for (const entry of clientEntries) {
    if (entry.status !== WaitlistStatus.EXPIRED) break;
    missedCount++;
  }
  return missedCount;
}

/**
 * Auto-pause pending waitlist requests after repeated expired soft holds.
 */
export function checkWaitlistAutoPause(
  entries: WaitlistEntry[],
  clientId: string,
  maxMisses: number = 3
): { updatedEntries: WaitlistEntry[]; isPaused: boolean; missedCount: number } {
  const missedCount = countConsecutiveExpiries(entries, clientId);
  const isPaused = missedCount >= maxMisses;
  const updatedEntries = entries.map((entry) => {
    if (isPaused && entry.clientId === clientId && entry.status === WaitlistStatus.PENDING) {
      return { ...entry, status: WaitlistStatus.PAUSED };
    }
    return entry;
  });

  return { updatedEntries, isPaused, missedCount };
}
