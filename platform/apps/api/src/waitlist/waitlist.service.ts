import { prisma } from '../index';
import { WaitlistEntry, SlotHold, WaitlistConfig, ReleaseSource, WaitlistServiceDeps, DEFAULT_WAITLIST_CONFIG, WaitlistEntryStatus, HoldStatus, ClientWaitlistHistory } from './waitlist.domain';
import { Appointment, Booking } from '../domain';
import { calculateChecksum } from '../shared/utils';

/** T-170: Waitlist Management - auto-fills cancelled/no-show slots.
 * Integrates with T-095 no-show escalation and T-105 location support.
 * Hold = 15 min (not a booking); FIFO cascade; anti-spam: 3 misses → pause.
 */
export class WaitlistService {
  constructor(
    private readonly deps: WaitlistServiceDeps
  ) {}

  /** Create a new waitlist entry for a slot.
   * Called when appointment is cancelled or no-show, before releasing to waitlist.
   */
  async createWaitlistEntry(
    slotId: string,
    clientId: string,
    locationId: string,
    barberId: string,
    serviceId: string,
    agreedPrice: number
  ): Promise<WaitlistEntry> {
    // Check rate limit (WTL-008)
    const now = new Date();
    const hourKey = `${clientId}:${now.getHours()}`;
    const rateLimited = await this.deps.checkRateLimit(clientId, now.getHours());
    if (!rateLimited) {
      throw new Error('Rate limit exceeded - too many waitlist requests');
    }

    const entry: Omit<WaitlistEntry, 'id'> = {
      slotId,
      clientId,
      locationId,
      barberId,
      serviceId,
      agreedPrice,
      holdExpiry: new Date(Date.now() + 15 * 60 * 1000), // 15 min hold
      status: WaitlistEntryStatus.ACTIVE,
      holdStatus: HoldStatus.ACTIVE,
      missedCount: 0,
      createdAt: now,
      cascadeToNext: false,
    };

    const created = await this.deps.createWaitlistEntry(entry);
    return {
      ...created,
      id: created.id,
    };
  }

  /** Hold a slot for a client (15 min, not a booking).
   * Returns the slot hold record.
   */
  async holdSlot(
    slotId: string,
    clientId: string,
    locationId: string
  ): Promise<SlotHold> {
    const holdId = `hold_${slotId}_${Date.now()}`;
    const holdByTime = new Date();

    const hold: SlotHold = {
      id: holdId,
      slotId,
      locationId,
      barberId: '', // will be filled from slot data
      holdExpiry: new Date(Date.now() + 15 * 60 * 1000),
      holdByClientId: clientId,
      holdByTime,
      status: HoldStatus.ACTIVE,
    };

    // In production: create hold record, make slot invisible to new bookings
    // during hold period; re-appear after expiry
    return hold;
  }

  /** Release a slot hold and cascade to next person on waitlist.
   * Called when appointment is cancelled or no-show (T-095 integration).
   */
  async releaseHold(
    holdId: string,
    source: ReleaseSource,
    releasedBy: string
  ): Promise<{ hold: SlotHold; nextOffer?: WaitlistOffer; newBooking?: Booking }> {
    // Find and update the hold
    const hold = await prisma.$executeRaw`
      UPDATE SlotHold 
      SET status = 'released', releasedAt = NOW()
      WHERE id = ${holdId}
    `;

    // Get active waitlist entries for this location, FIFO order
    const activeWaitlist = await this.deps.getActiveWaitlist(
      holdId.includes('location_') ? 'LOCATION_ID' : 'unknown'
    );

    if (!activeWaitlist || activeWaitlist.length === 0) {
      return { hold: {} as SlotHold, nextOffer: undefined, newBooking: undefined };
    }

    // FIFO: first entry is next to offer
    const nextEntry = activeWaitlist[0];
    if (!nextEntry) {
      return { hold: {} as SlotHold, nextOffer: undefined, newBooking: undefined };
    }

    // Remove this entry from waitlist (FIFO pop)
    await prisma.$executeRaw`
      DELETE FROM WaitlistEntry 
      WHERE id = ${nextEntry.id}
    `;

    // Update client history (increment missed count if applicable)
    await this.updateClientHistory(nextEntry.clientId, source);

    // Create offer to client via push notification
    const offer: WaitlistOffer = {
      offerId: `offer_${nextEntry.id}_${Date.now()}`,
      slotId: nextEntry.slotId,
      locationId: nextEntry.locationId,
      barberId: nextEntry.barberId,
      serviceId: nextEntry.serviceId,
      agreedPrice: nextEntry.agreedPrice,
      holdExpiry: nextEntry.holdExpiry,
      offerExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 min to accept
      source,
      message: `Ваш місце у черзі! Датуйте {time} на {barber}. Будь ласка, підтвердіть у течение 10 хвилин.`,
    };

    // Try to create a booking from the offer
    let newBooking: Booking | undefined;
    try {
      newBooking = await this.deps.fulfillWaitlistEntry(
        offer.offerId,
        nextEntry.clientId
      );
    } catch (error) {
      // Booking failed (e.g., slot no longer available); mark entry expired
      await prisma.$executeRaw`
        UPDATE WaitlistEntry 
        SET status = 'expired', releasedAt = NOW()
        WHERE id = ${nextEntry.id}
      `;
    }

    return {
      hold: {} as SlotHold,
      nextOffer: offer,
      newBooking,
    };
  }

  /** Update client waitlist history (anti-spam: 3 misses → pause) */
  private async updateClientHistory(
    clientId: string,
    source: ReleaseSource
  ): Promise<void> {
    let history = await prisma.clientWaitlistHistory.findUnique({
      where: { clientId },
    });

    if (!history) {
      history = await prisma.clientWaitlistHistory.create({
        data: { clientId, noShowsOnWaitlist: 0, missesOnWaitlist: 0 },
      });
    }

    // Increment based on source
    if (source === ReleaseSource.APPOINTMENT_NO_SHOW) {
      history = await prisma.clientWaitlistHistory.update({
        where: { clientId },
        data: { missesOnWaitlist: history.missesOnWaitlist + 1 },
      });
    }

    // Anti-spam: 3 misses → pause
    if (history.missesOnWaitlist >= 3) {
      await prisma.clientWaitlistHistory.update({
        where: { clientId },
        data: {
          isPaused: true,
          pauseUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });
    }
  }

  /** Get active waitlist entries for a location (FIFO order) */
  async getActiveWaitlist(locationId?: string): Promise<WaitlistEntry[]> {
    const where = locationId
      ? { locationId, status: WaitlistEntryStatus.ACTIVE }
      : { status: WaitlistEntryStatus.ACTIVE };

    return prisma.waitlistEntry.findMany({
      where,
      order: { createdAt: 'asc' }, // FIFO
      include: {
        client: { include: { user: true } },
        slot: true,
      },
    });
  }

  /** Get client waitlist history */
  async getClientHistory(clientId: string): Promise<ClientWaitlistHistory> {
    const history = await prisma.clientWaitlistHistory.findUnique({
      where: { clientId },
    });

    if (!history) {
      return {
        clientId,
        noShowsOnWaitlist: 0,
        missesOnWaitlist: 0,
        isPaused: false,
      };
    }

    return {
      clientId: history.clientId,
      noShowsOnWaitlist: history.noShowsOnWaitlist ?? 0,
      missesOnWaitlist: history.missesOnWaitlist ?? 0,
      isPaused: history.isPaused ?? false,
      pauseUntil: history.pauseUntil,
    };
  }

  /** Check if client can join waitlist (rate limit + not paused) */
  async canJoinWaitlist(clientId: string): Promise<{ canJoin: boolean; reason?: string }> {
    // Check if client is paused
    const history = await this.getClientHistory(clientId);
    if (history.isPaused) {
      return {
        canJoin: false,
        reason: `Черга приостановлена на ${Math.ceil(
          (history.pauseUntil!.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
        )} днів через 3 пропуски`,
      };
    }

    // Check rate limit
    const now = new Date();
    const rateLimited = await this.deps.checkRateLimit(clientId, now.getHours());
    if (!rateLimited) {
      return { canJoin: false, reason: 'Превищено ліміт запитів у годину (5 шт.)' };
    }

    return { canJoin: true };
  }

  /** Cascade waitlist to next person (auto-fulfillment)
   * Called after no-show escalation (T-095) or cancellation
   */
  async cascadeWaitlist(
    slotId: string,
    locationId: string,
    source: ReleaseSource = ReleaseSource.APPOINTMENT_NO_SHOW
  ): Promise<{
    hold: SlotHold;
    offersSent: number;
    bookingsCreated: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let offersSent = 0;
    let bookingsCreated = 0;

    // Get active waitlist for location, FIFO
    const activeWaitlist = await this.getActiveWaitlist(locationId);

    for (const entry of activeWaitlist) {
      if (offersSent >= 3) break; // max 3 attempts per cascade

      try {
        // Create hold for next person
        const hold = await this.holdSlot(
          slotId,
          entry.clientId,
          locationId
        );

        // Create offer
        const offer: WaitlistOffer = {
          offerId: `offer_${entry.id}_${Date.now()}`,
          slotId,
          locationId,
          barberId: entry.barberId,
          serviceId: entry.serviceId,
          agreedPrice: entry.agreedPrice,
          holdExpiry: entry.holdExpiry,
          offerExpiry: new Date(Date.now() + 10 * 60 * 1000),
          source,
          message: `Ваш місце у черзі! Будь ласка, підтвердіть у течение 10 хвилин.`,
        };

        // Try to fulfill (create booking)
        const newBooking = await this.deps.fulfillWaitlistEntry(
          offer.offerId,
          entry.clientId
        );

        offersSent++;
        bookingsCreated++;

        // Only do one fulfillment per cascade call in production
        // (remove after first success to avoid double-booking)
        break;
      } catch (error) {
        errors.push(`Waitlist cascade error for entry ${entry.id}: ${error instanceof Error ? error.message : String(error)}`);
        // Mark entry as expired and continue to next
        await prisma.$executeRaw`
          UPDATE WaitlistEntry 
          SET status = 'expired', releasedAt = NOW()
          WHERE id = ${entry.id}
        `;
      }
    }

    return { hold: {} as SlotHold, offersSent, bookingsCreated, errors };
  }
}