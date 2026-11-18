import { WaitlistEntry, WaitlistStatus, SoftHoldConfig, SlotRecoveryEvent } from './types';

export function sortWaitlistEntries(entries: WaitlistEntry[]): WaitlistEntry[] {
  return [...entries].sort((a, b) => {
    // Primary: priorityScore descending
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    // Secondary: createdAt ascending (FIFO)
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

export function processWaitlistCascade(
  entries: WaitlistEntry[],
  recoveryEvent: SlotRecoveryEvent,
  config: SoftHoldConfig,
  now: Date
): {
  updatedEntries: WaitlistEntry[];
  offeredEntry?: WaitlistEntry;
} {
  const updatedEntries = entries.map(entry => {
    // Check if any existing OFFERED entry has expired
    if (entry.status === WaitlistStatus.OFFERED && entry.softHoldExpiresAt) {
      if (new Date(entry.softHoldExpiresAt).getTime() <= now.getTime()) {
        return {
          ...entry,
          status: WaitlistStatus.EXPIRED,
        };
      }
    }
    return entry;
  });

  // Check if there is already an active OFFERED entry that hasn't expired
  const activeOffer = updatedEntries.find(
    e => e.status === WaitlistStatus.OFFERED && e.softHoldExpiresAt && new Date(e.softHoldExpiresAt).getTime() > now.getTime()
  );

  if (activeOffer) {
    return { updatedEntries };
  }

  // Find next pending candidate matching location and service
  const sorted = sortWaitlistEntries(updatedEntries);
  const nextCandidateIndex = sorted.findIndex(
    e =>
      e.status === WaitlistStatus.PENDING &&
      e.locationId === recoveryEvent.locationId &&
      e.serviceId === recoveryEvent.serviceId &&
      (!recoveryEvent.barberId || !e.barberId || e.barberId === recoveryEvent.barberId)
  );

  if (nextCandidateIndex === -1) {
    return { updatedEntries };
  }

  const candidate = sorted[nextCandidateIndex];
  if (!candidate) {
    return { updatedEntries };
  }

  const holdExpiry = new Date(now.getTime() + config.holdDurationMinutes * 60 * 1000);

  const offeredCandidate: WaitlistEntry = {
    id: candidate.id,
    clientId: candidate.clientId,
    locationId: candidate.locationId,
    serviceId: candidate.serviceId,
    preferredDate: candidate.preferredDate,
    priorityScore: candidate.priorityScore,
    createdAt: candidate.createdAt,
    status: WaitlistStatus.OFFERED,
    softHoldExpiresAt: holdExpiry.toISOString(),
    ...(candidate.barberId ? { barberId: candidate.barberId } : {}),
  };

  const finalEntries = updatedEntries.map(e => (e.id === offeredCandidate.id ? offeredCandidate : e));

  return {
    updatedEntries: finalEntries,
    offeredEntry: offeredCandidate,
  };
}

export function checkWaitlistAutoPause(
  entries: WaitlistEntry[],
  clientId: string,
  maxMisses: number = 3
): { updatedEntries: WaitlistEntry[]; isPaused: boolean; missedCount: number } {
  const clientEntries = entries.filter(
    e => e.clientId === clientId && e.status !== WaitlistStatus.PENDING && e.status !== WaitlistStatus.CONFIRMED
  );
  const sortedByTime = [...clientEntries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  let missedCount = 0;
  for (const entry of sortedByTime) {
    if (entry.status === WaitlistStatus.EXPIRED) {
      missedCount++;
    } else {
      break;
    }
  }

  const isPaused = missedCount >= maxMisses;
  const updatedEntries = entries.map(entry => {
    if (isPaused && entry.clientId === clientId && entry.status === WaitlistStatus.PENDING) {
      return {
        ...entry,
        status: WaitlistStatus.PAUSED,
      };
    }
    return entry;
  });

  return {
    updatedEntries,
    isPaused,
    missedCount,
  };
}

export function calculateWaitlistUrgencyBonus(
  basePriorityScore: number,
  hoursUntilSlot: number,
  isVip: boolean = false
): number {
  let bonus = 0;
  if (hoursUntilSlot <= 6) {
    bonus += 50;
  } else if (hoursUntilSlot <= 24) {
    bonus += 20;
  }
  if (isVip) {
    bonus += 30;
  }
  return basePriorityScore + bonus;
}
