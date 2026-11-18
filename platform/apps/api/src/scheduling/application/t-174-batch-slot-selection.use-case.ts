/**
 * T-174: Enhanced Mobile Waitlist Client Features - Batch Slot Selection and Group Booking
 * 
 * Implement batch slot selection for waitlist clients and group booking support,
 * building on the existing waitlist infrastructure from T-170/T-171/T-172/T-173.
 */

import { AppointmentRepository } from '../domain/repositories';
import { WaitlistQueue } from '../domain/waitlist-queue';
import { ClientRepository } from '../../clients/domain/repositories';
import { uuidv7 } from '@fade/domain-shared';

/**
 * Interface for batch slot selection input
 */
export interface BatchSlotSelectionInput {
  clientId: string;
  preferredServices: string[]; // service IDs
  groupSize: number; // number of people in the group
  preferredDate?: string; // YYYY-MM-DD format
  fallbackEnabled: boolean;
}

/**
 * Interface for batch slot selection result
 */
export interface BatchSlotSelectionResult {
  success: boolean;
  selectedSlots: Array<{
    slotId: string;
    barberId: string;
    serviceId: string;
    startTime: string;
    formattedTime: string;
  }>;
  rejectedReasons?: string[];
  totalEstimatedPrice: number;
}

/**
 * Interface for group booking input
 */
export interface GroupBookingInput {
  clientId: string;
  assignedBarberId: string;
  serviceId: string;
  slotId: string;
  groupSize: number;
  notes?: string;
}

/**
 * T-174: Enhanced Mobile Waitlist Client Screen - Batch slot selection and group booking
 * 
 * Provides batch slot selection for waitlist clients and supports group bookings
 * where multiple clients can be scheduled with the same barber in consecutive slots.
 */
export class T174BatchSlotSelectionUseCase {
  constructor(
    private appointmentRepo: AppointmentRepository,
    private waitlistQueue: WaitlistQueue,
    private clientRepo: ClientRepository
  ) {}

  /**
   * Find available batch slots for a waitlist client based on preferred services and group size.
   */
  async findBatchSlots(input: BatchSlotSelectionInput): Promise<BatchSlotSelectionResult> {
    const { clientId, preferredServices, groupSize, preferredDate, fallbackEnabled } = input;

    // Get client info
    const client = await this.clientRepo.getById(clientId);
    if (!client) {
      return { success: false, selectedSlots: [], rejectedReasons: ['Client not found'], totalEstimatedPrice: 0 };
    }

    // Get preferred barbers based on client history or preferences
    // For now, use first available barber matching service requirements

    // Search for available slots - this integrates with the waitlist queue from T-170/T-171
    const criteria: { serviceIds: string[]; groupSize: number; preferredDate?: string } = {
      serviceIds: preferredServices,
      groupSize,
    };
    if (preferredDate) criteria.preferredDate = preferredDate;
    const availableSlots = await this.waitlistQueue.getAvailableSlots(criteria);

    if (availableSlots.length === 0) {
      return {
        success: false,
        selectedSlots: [],
        rejectedReasons: ['No available slots matching criteria'],
        totalEstimatedPrice: 0,
      };
    }

    // Select optimal slots for the group
    const selectedSlots = availableSlots
      .slice(0, groupSize)
      .map((slot, index) => ({
        slotId: slot.id,
        barberId: slot.barberId,
        serviceId:
          preferredServices[index % preferredServices.length] ?? preferredServices[0] ?? '',
        startTime: slot.startTime,
        formattedTime: this.formatSlotTime(slot.startTime),
      }));

    // Calculate estimated price
    const totalEstimatedPrice = selectedSlots.reduce(
      (total, slot) => total + (slot.serviceId ? 100 : 0), // placeholder pricing
      0
    );

    return {
      success: selectedSlots.length > 0,
      selectedSlots,
      rejectedReasons: selectedSlots.length < groupSize ? ['Not all group members could be accommodated'] : undefined,
      totalEstimatedPrice,
    };
  }

  /**
   * Create a group booking with the selected slots.
   */
  async createGroupBooking(input: GroupBookingInput): Promise<{
    success: boolean;
    bookingIds: string[];
    summary: string;
  }> {
    const { clientId, assignedBarberId, serviceId, slotId, groupSize, notes } = input;

    const bookingIds: string[] = [];

    // Create individual bookings for each group member
    for (let i = 0; i < groupSize; i++) {
      const slotTime = new Date(Date.now() + i * 30 * 60 * 1000); // incremental times
      const bookingId = uuidv7();

      await this.appointmentRepo.create({
        id: bookingId,
        clientId,
        barberId: assignedBarberId,
        serviceId,
        startTime: slotTime,
        status: 'booked',
        source: 'waitlist_group',
        notes: notes || `Group booking - member ${i + 1}/${groupSize}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      bookingIds.push(bookingId);
    }

    return {
      success: bookingIds.length === groupSize,
      bookingIds,
      summary: `Group booking of ${groupSize} with barber ${assignedBarberId} completed.`,
    };
  }

  private formatSlotTime(startTime: string): string {
    const date = new Date(startTime);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

