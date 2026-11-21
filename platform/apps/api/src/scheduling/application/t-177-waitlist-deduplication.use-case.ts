/**
 * T-177: Waitlist Deduplication and Client History Integration
 *
 * Implement waitlist deduplication and client visit history integration,
 * ensuring clients don't get multiple waitlist entries and
 * their visit history is properly tracked for priority scoring.
 */

import { Inject, Injectable } from '@nestjs/common';
import { WaitlistQueue } from '../domain/waitlist-queue';
import { CLIENT_REPOSITORY, type ClientRepository } from '../../clients/domain/repositories';
import { APPOINTMENT_RECORD_REPOSITORY, type AppointmentRepository } from '../domain/repositories';
import { v4 as uuidv4 } from '../../lib/uuid';

/**
 * Interface for deduplication check input
 */
export interface DeduplicationCheckInput {
  clientId: string;
  serviceId: string;
}

/**
 * Interface for deduplication check result
 */
export interface DeduplicationCheckResult {
  isDuplicate: boolean;
  existingEntry?: {
    entryId: string;
    bookedAt: string;
    status: string;
  };
  shouldPromote: boolean;
}

/**
 * T-177: Waitlist Deduplication and Client History Integration
 *
 * Ensures clients don't receive duplicate waitlist entries and
 * integrates with client visit history for better priority scoring.
 */
@Injectable()
export class T177WaitlistDeduplicationUseCase {
  constructor(
    @Inject(WaitlistQueue) private waitlistQueue: WaitlistQueue,
    @Inject(CLIENT_REPOSITORY) private clientRepo: ClientRepository,
    @Inject(APPOINTMENT_RECORD_REPOSITORY) private appointmentRepo: AppointmentRepository
  ) {}

  /**
   * Check if a client already has an active waitlist entry or recent booking.
   * Returns deduplication status and whether they should be promoted.
   */
  async checkDeduplication(input: DeduplicationCheckInput): Promise<DeduplicationCheckResult> {
    const { clientId } = input;

    // Check for active waitlist entry
    const activeEntry = await this.waitlistQueue.getActiveEntry(clientId);

    // Check for recent bookings (within last 30 days)
    const recentBookings = await this.appointmentRepo.findMany({
      where: {
        clientId,
        status: 'completed',
        startedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        },
      },
      take: 1,
    });

    const isDuplicate = !!(activeEntry || recentBookings.length > 0);

    // Determine if client should be promoted (has history, can be moved to front)
    const latestBooking = recentBookings[0];
    const shouldPromote = !isDuplicate || latestBooking?.status === 'completed';

    let existingEntryInfo;
    if (activeEntry) {
      existingEntryInfo = {
        entryId: activeEntry.id,
        bookedAt: activeEntry.addedAt.toISOString(),
        status: activeEntry.status,
      };
    }

    return {
      isDuplicate,
      ...(existingEntryInfo === undefined ? {} : { existingEntry: existingEntryInfo }),
      shouldPromote,
    };
  }

  /**
   * Create or update a waitlist entry, ensuring no duplicates.
   * If client already has entry, update it rather than create new.
   */
  async upsertWaitlistEntry(
    clientId: string,
    serviceId: string
  ): Promise<{
    success: boolean;
    entryId: string;
    duplicate: boolean;
  }> {
    // Check for existing entry
    const deduplicationResult = await this.checkDeduplication({ clientId, serviceId });

    if (deduplicationResult.isDuplicate && deduplicationResult.existingEntry) {
      // Update existing entry - move to front of queue
      await this.waitlistQueue.moveToFront(deduplicationResult.existingEntry.entryId);
      return { success: true, entryId: deduplicationResult.existingEntry.entryId, duplicate: true };
    }

    // Create new waitlist entry
    const entryId = uuidv4();
    const now = new Date();

    await this.waitlistQueue.addEntry({
      id: entryId,
      clientId,
      serviceId,
      addedAt: now,
      status: 'active',
    });

    return { success: true, entryId, duplicate: false };
  }

  /**
   * Remove a waitlist entry when client books or is promoted.
   */
  async removeWaitlistEntry(entryId: string): Promise<{ success: boolean }> {
    await this.waitlistQueue.removeEntry(entryId);
    return { success: true };
  }
}
