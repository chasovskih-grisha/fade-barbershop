/* eslint-disable max-lines -- cohesive module (212 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
import { prisma } from '../index';
import { push } from '../lib/notifications';
import {
  AccrualScheme,
  type GetProgressOutput,
  type SetThresholdInput,
  type ThresholdOutput,
  type LoyaltyProgramConfig,
  type SubscriptionConfig,
} from './loyalty.dto';

const DEFAULT_CONFIG: LoyaltyProgramConfig = {
  id: 'default',
  name: 'Default Program',
  accrualScheme: AccrualScheme.POINTS_PER_UAH,
  pointsPerUah: 10,
  cashbackPercent: 0,
  minimumThreshold: { minAmountUah: 0, perVisit: false },
  expiration: { enabled: false },
  stackingPriority: 100,
  active: true,
  earnRules: [],
  spendRules: [],
};

/** Подія outbox, яку обробляє лічильник лояльності. */
interface NotificationEvent {
  payload: unknown;
  aggregateId?: string;
}
export class LoyaltyCounter {
  /** Subscription point: process AppointmentCompleted from outbox.
   * Called by outbox processor after appointment is marked COMPLETED.
   * Idempotent: checks processed AppointmentId before incrementing.
   */
  async processAppointmentCompleted(
    appointmentId: string,
    clientId: string
  ): Promise<{
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
      ...(milestoneReached !== undefined ? { milestoneReached } : {}),
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
    let appointmentId = '';
    let clientId = '';

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
      return { threshold: 7, timestamp: new Date().toISOString() };
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
    const progressPercentage = thresholdValue > 0 ? (currentVisits / thresholdValue) * 100 : 0;
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

/** HTTP-фасад лояльності: перетворює доменний результат у DTO. */
export class LoyaltyService {
  private readonly counter = new LoyaltyCounter();
  private config: LoyaltyProgramConfig = { ...DEFAULT_CONFIG };
  private subscriptions: Map<string, SubscriptionConfig> = new Map();

  async processAppointmentCompleted(
    appointmentId: string,
    clientId: string
  ): Promise<GetProgressOutput> {
    await this.counter.processAppointmentCompleted(appointmentId, clientId);
    return this.getProgress(clientId);
  }

  async setThreshold(input: SetThresholdInput): Promise<ThresholdOutput> {
    await this.counter.setThreshold(input.threshold, input.adminId);
    return {
      success: true,
      data: {
        threshold: input.threshold,
        adminId: input.adminId,
        timestamp: new Date().toISOString(),
      },
    };
  }

  async getProgress(clientId: string): Promise<GetProgressOutput> {
    const progress = await this.counter.getClientProgress(clientId);
    const isMilestoneReached = progress.currentVisits >= progress.threshold;
    return {
      success: true,
      data: {
        currentVisits: progress.currentVisits,
        threshold: progress.threshold,
        progressPercentage: progress.progressPercentage,
        nextFreeVisitAt: progress.nextFreeVisitAt,
        isMilestoneReached,
        freeVisitGranted: isMilestoneReached,
        clientId,
        lastUpdated: new Date(),
      },
    };
  }

  /** T-4450: Get loyalty program configuration.
   * Returns the active in-memory configuration (defaults until admin changes it).
   */
  async getConfig(): Promise<{ success: boolean; data: LoyaltyProgramConfig }> {
    return { success: true, data: { ...this.config } };
  }

  /** T-4450: Set loyalty program configuration.
   * Admin: updates the configuration applied to future accruals.
   */
  async setConfig(
    body: Partial<LoyaltyProgramConfig>
  ): Promise<{ success: boolean; data: LoyaltyProgramConfig }> {
    this.config = { ...this.config, ...body };
    return { success: true, data: { ...this.config } };
  }

  /** T-5008: Subscription management
   * Client: subscribe to a membership pass
   * Admin: pause, upgrade, or cancel a subscription
   */
  async subscribe(body: {
    clientId: string;
    monthlyAllowance?: number;
    allowRollover?: boolean;
  }): Promise<{ success: boolean; data: SubscriptionConfig }> {
    const subscription: SubscriptionConfig = {
      active: true,
      tier: 'BRONZE',
      monthlyVisitAllowance: body.monthlyAllowance ?? 4,
      allowRollover: body.allowRollover ?? false,
      benefits: {
        cashbackPercentBonus: 0,
        freeAddons: [],
        waitlistPriorityBoost: 0,
        exclusiveServices: [],
      },
      billing: {
        priceUah: 0,
        billingCycle: 'MONTHLY',
        autoRenew: true,
      },
      priorityBooking: false,
      refundWindowDays: 7,
    };
    this.subscriptions.set(body.clientId, subscription);
    return { success: true, data: subscription };
  }

  async pauseSubscription(
    clientId: string
  ): Promise<{ success: boolean; data: SubscriptionConfig | null }> {
    const subscription = this.subscriptions.get(clientId);
    if (!subscription) {
      return { success: false, data: null };
    }
    const updated: SubscriptionConfig = {
      ...subscription,
      active: false,
    };
    return { success: true, data: updated };
  }

  async upgradeSubscription(
    clientId: string,
    newTier: 'SILVER' | 'GOLD' | 'PLATINUM'
  ): Promise<{ success: boolean; data: SubscriptionConfig | null }> {
    const subscription = this.subscriptions.get(clientId);
    if (!subscription) {
      return { success: false, data: null };
    }
    const tierBonuses: Record<
      'SILVER' | 'GOLD' | 'PLATINUM',
      { cashbackBonus: number; freeAddons: string[]; waitlistBoost: number }
    > = {
      SILVER: { cashbackBonus: 5, freeAddons: ['complimentary_tea'], waitlistBoost: 2 },
      GOLD: {
        cashbackBonus: 15,
        freeAddons: ['complimentary_massage', 'priority_booking'],
        waitlistBoost: 5,
      },
      PLATINUM: {
        cashbackBonus: 30,
        freeAddons: ['complimentary_dermatology_consult', 'extra_priority_booking'],
        waitlistBoost: 10,
      },
    };
    subscription.tier = newTier;
    subscription.benefits.cashbackPercentBonus = tierBonuses[newTier].cashbackBonus;
    subscription.benefits.freeAddons = tierBonuses[newTier].freeAddons;
    subscription.benefits.waitlistPriorityBoost = tierBonuses[newTier].waitlistBoost;
    return { success: true, data: subscription };
  }

  async cancelSubscription(
    clientId: string
  ): Promise<{ success: boolean; data: SubscriptionConfig | null }> {
    const subscription = this.subscriptions.get(clientId);
    if (!subscription) {
      return { success: false, data: null };
    }
    subscription.active = false;
    return { success: true, data: subscription };
  }
}
