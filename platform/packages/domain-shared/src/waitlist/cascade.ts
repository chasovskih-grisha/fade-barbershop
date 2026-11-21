import type { ProcessWaitlistCascadeInput, WaitlistCascadeResult, WaitlistEntry } from './types';
import { WaitlistStatus } from './types';
import { sortWaitlistEntries } from './sorting';

function expireOffers(entries: WaitlistEntry[], now: Date): WaitlistEntry[] {
  return entries.map((entry) => {
    if (entry.status === WaitlistStatus.OFFERED && entry.softHoldExpiresAt) {
      if (new Date(entry.softHoldExpiresAt).getTime() <= now.getTime()) {
        return { ...entry, status: WaitlistStatus.EXPIRED };
      }
    }
    return entry;
  });
}

function hasActiveOffer(entries: WaitlistEntry[], now: Date): boolean {
  return entries.some(
    (entry) =>
      entry.status === WaitlistStatus.OFFERED &&
      entry.softHoldExpiresAt &&
      new Date(entry.softHoldExpiresAt).getTime() > now.getTime()
  );
}

function matchesRecoverySlot(
  entry: WaitlistEntry,
  recoveryEvent: ProcessWaitlistCascadeInput['recoveryEvent']
): boolean {
  const barberMatches =
    !recoveryEvent.barberId || !entry.barberId || entry.barberId === recoveryEvent.barberId;
  return (
    entry.status === WaitlistStatus.PENDING &&
    entry.locationId === recoveryEvent.locationId &&
    entry.serviceId === recoveryEvent.serviceId &&
    barberMatches
  );
}

function buildOfferedCandidate(candidate: WaitlistEntry, holdExpiry: Date): WaitlistEntry {
  return {
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
}

/**
 * Expire stale soft holds and offer the recovered slot to the next eligible client.
 */
export function processWaitlistCascade(input: ProcessWaitlistCascadeInput): WaitlistCascadeResult {
  const { entries, recoveryEvent, config, now } = input;
  const updatedEntries = expireOffers(entries, now);
  if (hasActiveOffer(updatedEntries, now)) return { updatedEntries };

  const sorted = sortWaitlistEntries(updatedEntries);
  const candidate = sorted.find((entry) => matchesRecoverySlot(entry, recoveryEvent));
  if (!candidate) return { updatedEntries };

  const holdExpiry = new Date(now.getTime() + config.holdDurationMinutes * 60 * 1000);
  const offeredEntry = buildOfferedCandidate(candidate, holdExpiry);
  const finalEntries = updatedEntries.map((entry) =>
    entry.id === offeredEntry.id ? offeredEntry : entry
  );

  return { updatedEntries: finalEntries, offeredEntry };
}
