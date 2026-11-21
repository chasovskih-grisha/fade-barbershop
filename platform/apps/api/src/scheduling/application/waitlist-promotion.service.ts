/* eslint-disable max-lines, max-params -- cohesive module (108 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 1 signature whose 4-param contract is fixed by existing call sites (worst: processSlotRecovery, limit 3); API redesign tracked in T-2500f */
export type WaitlistStatus = 'WAITING' | 'OFFERED' | 'BOOKED' | 'EXPIRED' | 'CANCELLED';

export interface WaitlistEntry {
  id: string;
  clientId: string;
  locationId: string;
  barberId: string;
  serviceId: string;
  desiredStart: string;
  desiredEnd: string;
  status: WaitlistStatus;
  waitingSince: Date;
  vipLevel: number; // 0 normal, 1 VIP
  noShowCount90d: number;
  holdExpiresAt?: Date;
}

export interface SlotRecoveryInput {
  locationId: string;
  barberId: string;
  start: string;
  end: string;
}

export interface WaitlistPromotionResult {
  promotedEntryId?: string;
  offeredClientId?: string;
  expiresAt?: Date;
}

export class WaitlistPromotionService {
  /**
   * Computes priority score for a waitlist entry.
   * Higher score = higher priority.
   * Factors: VIP level (weight 100), waiting time in hours (weight 1 per hour), minus penalty for no-shows (weight 50 per no-show).
   */
  computePriority(entry: WaitlistEntry, now: Date = new Date()): number {
    const hoursWaiting = (now.getTime() - entry.waitingSince.getTime()) / (1000 * 60 * 60);
    const vipBonus = entry.vipLevel * 100;
    const noShowPenalty = entry.noShowCount90d * 50;
    return vipBonus + hoursWaiting - noShowPenalty;
  }

  /**
   * Processes slot recovery: when an appointment is cancelled, find the best matching waiting entry,
   * promote it to 'OFFERED', and set a soft-hold expiration time.
   */
  processSlotRecovery(
    recoveredSlot: SlotRecoveryInput,
    entries: WaitlistEntry[],
    now: Date = new Date(),
    holdDurationMinutes: number = 30
  ): { updatedEntries: WaitlistEntry[]; result: WaitlistPromotionResult } {
    // Filter waiting entries for the same location and barber (or any barber if not strictly bound)
    const candidates = entries.filter(
      (e) =>
        e.status === 'WAITING' &&
        e.locationId === recoveredSlot.locationId &&
        (e.barberId === recoveredSlot.barberId || !e.barberId)
    );

    if (candidates.length === 0) {
      return { updatedEntries: entries, result: {} };
    }

    // Sort by computed priority descending, then FIFO (waitingSince ascending)
    candidates.sort((a, b) => {
      const scoreA = this.computePriority(a, now);
      const scoreB = this.computePriority(b, now);
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      return a.waitingSince.getTime() - b.waitingSince.getTime();
    });

    const bestCandidate = candidates[0];
    if (!bestCandidate) {
      return { updatedEntries: entries, result: {} };
    }
    const expiresAt = new Date(now.getTime() + holdDurationMinutes * 60 * 1000);

    const updatedEntries = entries.map((entry) => {
      if (entry.id === bestCandidate.id) {
        return {
          ...entry,
          status: 'OFFERED' as WaitlistStatus,
          holdExpiresAt: expiresAt,
        };
      }
      return entry;
    });

    return {
      updatedEntries,
      result: {
        promotedEntryId: bestCandidate.id,
        offeredClientId: bestCandidate.clientId,
        expiresAt,
      },
    };
  }

  /**
   * Evaluates hold expirations for 'OFFERED' waitlist entries.
   * If holdExpiresAt is passed, transitions status to 'EXPIRED'.
   */
  evaluateHoldExpiration(entries: WaitlistEntry[], now: Date = new Date()): WaitlistEntry[] {
    return entries.map((entry) => {
      if (
        entry.status === 'OFFERED' &&
        entry.holdExpiresAt &&
        entry.holdExpiresAt.getTime() <= now.getTime()
      ) {
        return {
          ...entry,
          status: 'EXPIRED' as WaitlistStatus,
        };
      }
      return entry;
    });
  }

  /**
   * Calculates optimal notification reminder schedule relative to appointment start time.
   */
  calculateOptimalReminderTiming(appointmentStart: Date): {
    freeCancellationReminderAt: Date;
    lateCancellationWarningAt: Date;
    arrivalCheckInAt: Date;
  } {
    const time = appointmentStart.getTime();
    return {
      freeCancellationReminderAt: new Date(time - 24 * 60 * 60 * 1000), // 24h before
      lateCancellationWarningAt: new Date(time - 4 * 60 * 60 * 1000), // 4h before
      arrivalCheckInAt: new Date(time - 30 * 60 * 1000), // 30m before
    };
  }
}
