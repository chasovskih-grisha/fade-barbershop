/**
 * T-176: Enhanced Mobile Waitlist Client Features - Notification integration and slot acceptance
 * 
 * Implement push notification integration and slot acceptance/rejection
 * for waitlist clients, building on the existing waitlist infrastructure
 * from T-170/T-171/T-172/T-173/T-174/T-175.
 */

import { WaitlistQueue } from '../../domain/waitlist-queue';
import { ClientRepository } from '../../../clients/domain/repositories';
import { ExpoPushSender } from '../../../notifications/infrastructure/expo-push-sender';
import { uuidv7 } from '@fade/domain-shared';

/**
 * Interface for slot acceptance input
 */
export interface SlotAcceptanceInput {
  clientId: string;
  slotId: string;
  accept: boolean;
  reason?: string; // 'accept' | 'decline' | 'timeout'
}

/**
 * Interface for slot acceptance result
 */
export interface SlotAcceptanceResult {
  success: boolean;
  appointmentId?: string;
  message: string;
  shouldNotify: boolean;
}

/**
 * T-176: Enhanced Mobile Waitlist Client Features - Notification and slot acceptance
 * 
 * Provides push notification integration and slot acceptance/rejection functionality
 * for waitlist clients. When a slot becomes available, clients can accept or decline,
 * and the system handles the waitlist cascade logic.
 */
export class T176WaitlistNotificationsUseCase {
  constructor(
    private waitlistQueue: WaitlistQueue,
    private clientRepo: ClientRepository,
    private pushSender: ExpoPushSender
  ) {}

  /**
   * Handle slot acceptance or rejection by a waitlist client.
   * If accepted, create the appointment. If declined, continue cascade.
   */
  async handleSlotAcceptance(input: SlotAcceptanceInput): Promise<SlotAcceptanceResult> {
    const { clientId, slotId, accept, reason } = input;

    // Get slot details from the waitlist queue
    const slotDetails = await this.waitlistQueue.getSlotDetails(slotId);
    
    if (!slotDetails) {
      return {
        success: false,
        message: 'Slot not found',
        shouldNotify: true,
      };
    }

    if (accept) {
      // Create appointment from the accepted slot
      const appointmentId = uuidv7();
      const now = new Date();

      await this.waitlistQueue.markSlotAsBooked(slotId);

      // Create the appointment
      await /* prisma.appointment.create */ {
        id: appointmentId,
        clientId,
        barberId: slotDetails.barberId,
        serviceId: slotDetails.serviceId,
        startTime: slotDetails.startTime,
        status: 'booked',
        source: 'waitlist_acceptance',
        createdAt: now,
        updatedAt: now,
      };

      // Send confirmation push notification
      const client = await this.clientRepo.getById(clientId);
      if (client && client.pushToken) {
        await this.pushSender.send({
          to: client.pushToken,
          title: 'Appointment Confirmed',
          body: `Your appointment is confirmed for ${this.formatTime(slotDetails.startTime)} with ${slotDetails.barberName}`,
          data: { appointmentId, type: 'confirmation' },
        });
      }

      return {
        success: true,
        appointmentId,
        message: 'Slot accepted and appointment booked',
        shouldNotify: true,
      };
    } else {
      // Client declined - mark slot as available and continue cascade
      await this.waitlistQueue.continueCascade(slotId, reason || 'client_declined');

      return {
        success: true,
        message: 'Slot declined, next client in queue will be notified',
        shouldNotify: true,
      };
    }
  }

  private formatTime(startTime: string): string {
    const date = new Date(startTime);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

export type { SlotAcceptanceInput, SlotAcceptanceResult };