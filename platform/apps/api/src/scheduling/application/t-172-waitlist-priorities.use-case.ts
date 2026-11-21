/* eslint-disable max-lines, complexity, max-params -- cohesive module (141 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 1 function with inherent domain branching (worst: calculateWaitlistUrgency, complexity 16 vs 10); refactor tracked in T-2500f | 2 signatures whose 5-param contract is fixed by existing call sites (worst: calculateWaitlistUrgency, limit 3); API redesign tracked in T-2500f */
// Waitlist Priority Scoring (T-172)
// FIFO with urgency scoring for waitlist auto-promotion when slots cancel.
// Extends T-170 waitlist core and T-171 waitlist surfaces.

import type { WaitlistQueue } from '../domain/waitlist-queue';
import type { ClientRepository } from '../../clients/domain/repositories';

/** Waitlist urgency score factors (T-172, WTL-001...007). */
export interface WaitlistUrgencyFactors {
  /** Скільки днів клієнт у черзі. */
  daysInQueue: number;
  /** Історія візитів — індикатор лояльності. */
  visitCount: number;
  isReferral: boolean;
  preferredBarberMatch: boolean;
  preferredServiceMatch: boolean;
  locationMatch: boolean;
  /** 0–100, більше — вищий пріоритет. */
  totalScore: number;
  tier: 'low' | 'medium' | 'high' | 'critical';
  /** Людське пояснення балу — для адмінки й анти-спам журналу. */
  reason: string;
}

/** Priority score result for waitlist auto-promotion (T-172). */
export interface WaitlistPriorityResult {
  clientId: string;
  score: number; // 0-100, higher = higher priority
  tier: 'low' | 'medium' | 'high' | 'critical';
  reason: string; // explanation for the score
  daysInQueue: number;
  canPromote: boolean; // whether client can be promoted now
}

/** Клієнтські поля, потрібні для балу пріоритету. */
export interface UrgencyProfile {
  visitCount: number;
  referredBy?: string | null;
}

/** Calculate waitlist urgency score for a client (T-172).
 * Higher scores get promoted first when slots become available.
 */
export function calculateWaitlistUrgency(
  clientId: string,
  daysInQueue: number,
  profile: UrgencyProfile,
  barberPreferences: { barberId?: string | null; serviceIds?: string[] },
  locationPreferences: { locationId?: string | null }
): WaitlistUrgencyFactors {
  const { visitCount, referredBy } = profile;
  const { barberId, serviceIds } = barberPreferences;
  const { locationId } = locationPreferences;

  // Бал за очікування (до 40)
  const daysScore = Math.min(40, Math.max(0, daysInQueue));

  // Реферальний бонус (до 25)
  const referralScore = referredBy ? 25 : 0;

  // Бонус лояльності (до 20)
  const loyaltyScore = Math.min(20, visitCount * 5);

  // Бонус за переваги барбера/послуг (до 15)
  let preferenceScore = 0;
  if (barberId) {
    preferenceScore += 8;
    if ((serviceIds?.length ?? 0) > 0) {
      preferenceScore += 7;
    }
  }

  // Матч локації (до 5)
  const locationScore = locationId ? 5 : 0;

  const totalScore = daysScore + referralScore + loyaltyScore + preferenceScore + locationScore;

  const tier: WaitlistUrgencyFactors['tier'] =
    totalScore >= 80 ? 'critical' : totalScore >= 60 ? 'high' : totalScore >= 40 ? 'medium' : 'low';

  const reasonParts: string[] = [];
  if (daysInQueue >= 14) reasonParts.push(`waited ${daysInQueue}+ days`);
  if (referredBy) reasonParts.push('referred client');
  if (visitCount >= 5) reasonParts.push(`${visitCount}+ visits`);
  if (barberId) reasonParts.push(`prefers barber ${barberId}`);
  if (locationId) reasonParts.push('same location');
  const reason = reasonParts.length > 0 ? reasonParts.join(', ') : 'standard queue position';

  return {
    daysInQueue,
    visitCount,
    isReferral: !!referredBy,
    preferredBarberMatch: !!barberId,
    preferredServiceMatch: (serviceIds?.length ?? 0) > 0,
    locationMatch: !!locationId,
    totalScore,
    tier,
    reason,
  };
}

/** Get waitlist entries sorted by priority for auto-promotion (T-172).
 * Returns clients sorted by urgency score (highest first).
 */
export async function getWaitlistPriorityQueue(
  queue: WaitlistQueue,
  clients: ClientRepository,
  locationId: string,
  barberId?: string,
  limit: number = 50
): Promise<Array<{ clientId: string; urgency: WaitlistUrgencyFactors }>> {
  const entries = (await queue.getAllEntriesWithPriority()).slice(0, limit);

  const results = await Promise.all(
    entries.map(async (entry) => {
      const client = await clients.getById(entry.clientId);
      const daysInQueue = Math.floor(entry.waitTimeMinutes / (60 * 24));
      const preferredBarber =
        client?.preferredBarberId && barberId && client.preferredBarberId === barberId
          ? barberId
          : null;
      return {
        clientId: entry.clientId,
        urgency: calculateWaitlistUrgency(
          entry.clientId,
          daysInQueue,
          {
            visitCount: client?.visitCount ?? 0,
            ...(client?.referredBy === undefined ? {} : { referredBy: client.referredBy }),
          },
          {
            ...(preferredBarber === null ? {} : { barberId: preferredBarber }),
            ...(client?.preferredServices === undefined
              ? {}
              : { serviceIds: client.preferredServices }),
          },
          { locationId }
        ),
      };
    })
  );

  return results.sort((a, b) => b.urgency.totalScore - a.urgency.totalScore);
}

/** Check if a waitlist client can be auto-promoted to a booking (T-172).
 * Verifies: queue membership, location preference and slot timing.
 */
export async function canAutoPromote(
  queue: WaitlistQueue,
  clients: ClientRepository,
  input: { clientId: string; locationId: string; slotStart: Date }
): Promise<{ canPromote: boolean; reason: string }> {
  const client = await clients.getById(input.clientId);
  if (!client) {
    return { canPromote: false, reason: 'Client profile inactive or not found' };
  }

  const activeEntry = await queue.getActiveEntry(input.clientId);
  if (!activeEntry) {
    return { canPromote: false, reason: 'Client has no active waitlist entry' };
  }

  if (client.preferredLocation && client.preferredLocation !== input.locationId) {
    return { canPromote: false, reason: 'Location does not match client preference' };
  }

  if (input.slotStart.getTime() < Date.now()) {
    return { canPromote: false, reason: 'Slot time has passed' };
  }

  return { canPromote: true, reason: 'Client eligible for auto-promotion' };
}

/** Журнал промоцій (T-172, WTL-001...007): ROI і анти-спам. */
export interface PromotionJournal {
  record(entry: {
    clientId: string;
    bookingId: string;
    originalPosition: number;
    promotedAt: Date;
  }): Promise<void>;
}

/** Record a waitlist promotion event through the journal port. */
export async function recordWaitlistPromotion(
  journal: PromotionJournal,
  input: { clientId: string; bookingId: string; originalPosition: number; promotedAt: Date }
): Promise<void> {
  await journal.record(input);
}
