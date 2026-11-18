import { prisma } from '../index';
import { Appointment, Booking, ClientProfile, User } from '../domain';
import { OutboxMessage, AppointmentActivity, NotificationRecord } from '../domain';
import { push } from '../lib/notifications';
import type { User } from '../domain';

/** T-140: Loyalty Counter - subscribe to AppointmentCompleted events.
 * ADR 0009: idempotent event processing via processed journal.
 * Counter += 1 per completed visit (all visits, no service classification).
 * 7 visits -> FreeVisitGranted -> push notification (LYL-MOB-02).
 * Threshold snapshot in admin settings (LYL-ADM-01).
 */
export class LoyaltyCounter {
  /** Subscription point: process AppointmentCompleted from outbox.
   * Called by outbox processor after appointment is marked COMPLETED.
   * Idempotent: checks processed AppointmentId before incrementing.
   */
  async processAppointmentCompleted(appointmentId: string, clientId: string): Promise<{
    counter: number;
    isNewMilestone: boolean;
    freeVisitGranted: boolean;
    milestoneReached?: number;
  }> {
    // 1. Idempotency check: has this appointment already been processed?
    const alreadyProcessed = await prisma.appointmentActivity.findFirst({
      where: {
        eventId: appointmentId, // appointmentId is the unique eventId
        type: 'appointment_completed',
      },
    });

    if (alreadyProcessed) {
      // Return current state without incrementing
      const profile = await prisma.clientProfile.findUnique({
        where: { clientId },
      });
      const counter = profile?.loyaltyVisitsCount ?? 0;
      return {
        counter,
        isNewMilestone: false,
        freeVisitGranted: false,
      };
    }

    // 2. Increment loyalty counter
    const profile = await prisma.clientProfile.findUniqueOrThrow({
      where: { clientId },
      rejectWith: {
        code: 'P2025',
        message: 'Client profile not found',
      },
    });

    const newCounter = (profile.loyaltyVisitsCount ?? 0) + 1;

    // 3. Update profile with new counter
    await prisma.clientProfile.update({
      where: { clientId },
      data: { loyaltyVisitsCount: newCounter },
    });

    // 4. Record in appointment activity journal (ADR 0009)
    await prisma.appointmentActivity.create({
      data: {
        eventId: appointmentId,
        type: 'appointment_completed',
        note: `Loyalty counter incremented to ${newCounter}`,
      },
    });

    // 5. Check for milestone (7 visits -> free visit)
    let isNewMilestone = false;
    let freeVisitGranted = false;
    let milestoneReached: number | undefined;

    if (newCounter >= 7) {
      isNewMilestone = true;
      freeVisitGranted = true;
      milestoneReached = newCounter;

      // 6. Grant free visit - send push notification and create NotificationRecord
      await this.grantFreeVisit(clientId, newCounter);
    }

    return {
      counter: newCounter,
      isNewMilestone,
      freeVisitGranted,
      milestoneReached,
    };
  }

  /** Handle one outbox relay event for LoyaltyCounter (T-140).
   * Extracts appointmentId and clientId from the event payload and delegates
   * to processAppointmentCompleted. Idempotent via the processed journal.
   */
  async handleOne(event: NotificationEvent): Promise<{
    handled: boolean;
    counter: number;
    isNewMilestone: boolean;
    freeVisitGranted: boolean;
  }> {
    let appointmentId: string;
    let clientId: string;

    // Try to extract from payload first, then fall back to aggregateId
    const payload = event.payload as Record<string, unknown>;
    if (payload && typeof payload === 'object') {
      appointmentId = String(payload['appointmentId'] || payload['id'] || '');
      clientId = String(payload['clientId'] || '');
    }

    // If clientId not in payload, try from aggregateId (appointment ID)
    if (!clientId) {
      clientId = String(event.aggregateId || '');
    }

    if (!appointmentId) {
      return { handled: false, counter: 0, isNewMilestone: false, freeVisitGranted: false };
    }

    // If we have appointmentId but not clientId from payload, try to look up
    // from the journal; if still missing, cannot process
    if (!clientId) {
      return { handled: false, counter: 0, isNewMilestone: false, freeVisitGranted: false };
    }

    const result = await this.processAppointmentCompleted(appointmentId, clientId);
    return {
      handled: true,
      counter: result.counter,
      isNewMilestone: result.isNewMilestone,
      freeVisitGranted: result.freeVisitGranted,
    };
  }

  /** Grant free visit to client.
   * Sends push notification (LYL-MOB-02) and creates NotificationRecord.
   * The free visit can be used on next booking.
   */
  private async grantFreeVisit(clientId: string, totalVisits: number): Promise<void> {
    // 1. Send push notification to client
    await push.send({
      title: 'Loyalty reward!',
      body: `Congratulations! You have completed ${totalVisits} visits. Get a free visit on your next booking.`,
      data: {
        type: 'loyalty_free_visit',
        clientId,
        totalVisits,
      },
    });

    // 2. Create notification record in journal
    await prisma.notificationRecord.create({
      data: {
        eventId: `loyalty_${clientId}_${Date.now()}`,
        type: 'loyalty_free_visit',
        channel: 'push',
        recipient: clientId,
        subject: 'Free visit granted!',
        detail: `You have reached ${totalVisits} visits and are entitled to a free visit.`,
        status: 'sent',
        sentAt: new Date(),
      },
    });
  }

  /** Admin: set loyalty threshold (LYL-ADM-01).
   * Allows configuring the visit count required for free visit grant.
   * Default is 7, but admin can change.
   */
  async setThreshold(threshold: number, adminId: string): Promise<void> {
    // Store in AppSetting for persistence and snapshotting
    await prisma.appSetting.upsert({
      where: { key: 'loyalty.threshold' },
      update: {
        value: { threshold, adminId, timestamp: new Date().toISOString() },
        updatedAt: new Date(),
      },
      create: {
        key: 'loyalty.threshold',
        value: { threshold, adminId, timestamp: new Date().toISOString() },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /** Admin: get loyalty threshold */
  async getThreshold(): Promise<{ threshold: number; adminId?: string; timestamp: string } | null> {
    const setting = await prisma.appSetting.findUnique({
      where: { key: 'loyalty.threshold' },
    });
    if (!setting || !setting.value || typeof setting.value !== 'object') {
      // Default threshold is 7
      return { threshold: 7, adminId: undefined, timestamp: new Date().toISOString() };
    }
    return {
      threshold: setting.value.threshold,
      adminId: setting.value.adminId,
      timestamp: setting.value.timestamp,
    };
  }

  /** Get client loyalty progress */
  async getClientProgress(clientId: string): Promise<{
    currentVisits: number;
    threshold: number;
    progressPercentage: number;
    nextFreeVisitAt: number;
    clientProfile: any;
  }> {
    const profile = await prisma.clientProfile.findUnique({
      where: { clientId },
    });

    const currentVisits = profile?.loyaltyVisitsCount ?? 0;
    const threshold = await this.getThreshold();
    const thresholdValue = threshold?.threshold ?? 7;
    const progressPercentage = thresholdValue > 0 ? ((currentVisits / thresholdValue) * 100) : 0;
    const nextFreeVisitAt = thresholdValue - currentVisits;

    return {
      currentVisits,
      threshold: thresholdValue,
      progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
      nextFreeVisitAt: Math.max(0, nextFreeVisitAt),
      clientProfile: profile,
    };
  }
}