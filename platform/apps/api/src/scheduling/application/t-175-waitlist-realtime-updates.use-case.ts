/**
 * T-175: Enhanced Mobile Waitlist Client Features - Pull-to-refresh and real-time waitlist updates
 * 
 * Implement pull-to-refresh functionality and real-time waitlist updates
 * for the mobile client, building on the existing waitlist infrastructure
 * from T-170/T-171/T-172/T-173.
 */

import { WaitlistQueue } from '../domain/waitlist-queue';
import { ClientRepository } from '../../clients/domain/repositories';
import { randomUUID } from 'node:crypto';

/**
 * Interface for real-time waitlist update input
 */
export interface RealTimeWaitlistUpdateInput {
  clientId: string;
  forceRefresh: boolean;
}

/**
 * Interface for real-time waitlist update result
 */
export interface RealTimeWaitlistUpdateResult {
  success: boolean;
  position: number | null;
  estimatedWaitTime: number | null;
  availableSlots: Array<{
    slotId: string;
    barberId: string;
    serviceId: string;
    startTime: string;
    formattedTime: string;
  }>;
  queueUpdatedAt: string;
  newEntries: Array<{
    clientId: string;
    name: string;
    addedAt: string;
  }>;
}

/**
 * T-175: Enhanced Mobile Waitlist Client Screen - Real-time waitlist updates
 * 
 * Provides pull-to-refresh and real-time waitlist status updates for mobile clients,
 * showing current position, estimated wait time, available slots, and new queue entries.
 */
export class T175WaitlistRealTimeUpdatesUseCase {
  constructor(
    private waitlistQueue: WaitlistQueue,
    private clientRepo: ClientRepository
  ) {}

  /**
   * Get real-time waitlist status for a client.
   * Includes position, estimated wait time, available slots, and recent queue changes.
   */
  async getRealTimeStatus(input: RealTimeWaitlistUpdateInput): Promise<RealTimeWaitlistUpdateResult> {
    const { clientId, forceRefresh } = input;

    // Get current queue position and estimated wait time
    const positionInfo = await this.waitlistQueue.getPosition(clientId);

    // Get available slots from the waitlist queue
    const availableSlots = await this.waitlistQueue.getAvailableSlots({
      serviceIds: [],
      groupSize: 1,
      preferredDate: undefined,
    });

    // Get recent queue additions (new entries)
    const newEntries = await this.waitlistQueue.getRecentEntries(5);

    // Calculate estimated wait time based on position and historical data
    const estimatedWaitTime = positionInfo.estimatedWaitTime 
      ? positionInfo.estimatedWaitTime 
      : this.calculateEstimatedWaitTime(positionInfo.position);

    return {
      success: true,
      position: positionInfo.position ?? null,
      estimatedWaitTime: estimatedWaitTime ?? null,
      availableSlots: availableSlots.slice(0, 3).map(slot => ({
        slotId: slot.id,
        barberId: slot.barberId,
        serviceId: slot.serviceId || '',
        startTime: slot.startTime,
        formattedTime: this.formatSlotTime(slot.startTime),
      })),
      queueUpdatedAt: positionInfo.queueUpdatedAt ?? new Date().toISOString(),
      newEntries: newEntries.map(entry => ({
        clientId: entry.clientId,
        name: entry.clientName || 'Unknown client',
        addedAt: entry.addedAt,
      })),
    };
  }

  /**
   * Calculate estimated wait time based on position in queue.
   */
  private calculateEstimatedWaitTime(position: number | null): number | null {
    if (position === null || position <= 0) return null;
    // Base wait time per position (in minutes) - average service duration + buffer
    const baseWaitTimePerPosition = 25;
    return position * baseWaitTimePerPosition;
  }

  private formatSlotTime(startTime: string): string {
    const date = new Date(startTime);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

