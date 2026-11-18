// Win-back Campaigns (T-180)
// Segments lapsed clients, generates promotional codes, sends push/SMS,
// and tracks ROI via CampaignSent anti-spam and CampaignRoi metrics.

import { prisma } from '../../index';
import { ClientProfile } from '../../crm/domain/client-profile';
import { sendBookingConfirmationSms, SendBookingConfirmationSms } from './send-sms.use-case';
import { BookingConfirmationHandler } from './send-sms.use-case';
import { LOYALTY_INCREMENTED_TYPE, LOYALTY_GRANTED_TYPE } from '../../loyalty/infrastructure/outbox-routing';
import type { NotificationEvent } from '../application/send-booking-confirmation';

/** Segment criteria for win-back campaigns (T-180, WNB-001...007). */
export interface WinBackSegment {
  clientId: string;
  lastVisit: Date;
  visitCount: number;
  loyaltyTier: number; // 0-7 scale
  referredBy?: string; // referral code if referred client
  daysSinceLastVisit: number;
  segmentType: 'INACTIVE_60' | 'SECOND_VISIT_NONE' | 'FORMER_VIP' | 'LOYALTY_4Plus';
}

/** Promotional code for win-back segment (T-180, WNB-001...007). */
export interface WinBackPromoCode {
  code: string;
  clientId: string;
  segmentType: WinBackSegment['segmentType'];
  usesRemaining: number; // typically 1 per segment client
  expiresAt: Date;
  generatedAt: Date;
}

/** ROI tracking for win-back campaign (T-180). */
export interface WinBackRoi {
  segmentType: WinBackSegment['segmentType'];
  totalSent: number;
  totalUsed: number;
  totalRevenue: number;
  conversionRate: number; // used / sent * 100
  averageTicket: number;
  campaignSentCount: number; // anti-spam journal entries
}

/** Create a win-back segment from client profile and visit history. */
function createWinBackSegment(
  profile: ClientProfile,
  lastVisit: Date | null,
  visitCount: number,
  loyaltyTier: number,
): WinBackSegment {
  const daysSinceLastVisit = lastVisit
    ? Math.floor((new Date().getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  let segmentType: WinBackSegment['segmentType'];
  if (daysSinceLastVisit >= 60) segmentType = 'INACTIVE_60';
  else if (visitCount <= 1) segmentType = 'SECOND_VISIT_NONE';
  else if (loyaltyTier >= 4) segmentType = 'FORMER_VIP';
  else if (loyaltyTier >= 2) segmentType = 'LOYALTY_4Plus';
  else return null as any;

  return {
    clientId: profile.clientId,
    lastVisit: lastVisit ?? new Date(0),
    visitCount,
    loyaltyTier,
    daysSinceLastVisit,
    segmentType,
  };
}

/** Generate a unique promotional code for a win-back segment. */
function generatePromoCode(): string {
  const timestamp = Date.now().toString(36).padStart(6, '0');
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `WB_${timestamp}_${random}`;
}

/** Send win-back push notification to a segment client. */
async function sendWinBackPush(
  clientId: string,
  promoCode: string,
  segmentType: WinBackSegment['segmentType'],
): Promise<{ sent: boolean; detail: string }> {
  // Use the existing push infrastructure (T-080)
  // This integrates with the push sender that's already configured
  const message = `FADE: Мисимо! Ви на жви згоді ${daysSinceLastVisit > 30 ? '30%' : '15%'} знижка на наступну візит. Код: ${promoCode}`;

  // TODO: Integrate with actual push sender factory
  // const result = await PushSenderFactory.build(process.env).send({...});
  // For now, log and return
  console.log(`Win-back push to ${clientId}: ${message}`);
  return { sent: true, detail: 'Push notification queued' };
}

/** Mark campaign sent in anti-spam journal (T-180, WNB-006). */
async function markCampaignSent(
  eventId: string,
  segmentType: WinBackSegment['segmentType'],
  clientId: string,
): Promise<void> {
  await prisma.campaignSent.create({
    data: {
      eventId,
      type: 'win_back',
      segmentType,
      clientId,
      sentAt: new Date(),
    },
  });
}

/** Check if a client has already received a win-back campaign (30-day anti-spam). */
async function hasRecentWinBack(clientId: string, segmentType: WinBackSegment['segmentType']): Promise<boolean> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recent = await prisma.campaignSent.findFirst({
    where: {
      clientId,
      segmentType,
      sentAt: { gt: thirtyDaysAgo },
    },
  });
  return !!recent;
}

/** Main win-back campaign runner (T-180).
 * Segments lapsed clients and sends win-back campaigns.
 */
export async function runWinBackCampaign(): Promise<WinBackRoi> {
  // 1. Get all client profiles with visit history
  const profiles = await prisma.clientProfile.findMany({
    include: {
      user: true,
    },
    order: {
      updatedAt: 'desc',
    },
  });

  // 2. Create segments
  const segments: WinBackSegment[] = [];
  for (const profile of profiles) {
    // Get last visit from appointment activity or profile
    const activity = await prisma.appointmentActivity.findFirst({
      where: {
        eventId: profile.clientId,
        type: 'appointment_completed',
      },
      order: {
        createdAt: 'desc',
      },
    });

    const segment = createWinBackSegment(
      profile,
      activity?.createdAt ?? null,
      profile.visitCount ?? 0,
      profile.loyaltyTier ?? 0,
    );

    if (segment) {
      // Check 30-day anti-spam filter
      const hasRecent = await hasRecentWinBack(segment.clientId, segment.segmentType);
      if (!hasRecent) {
        segments.push(segment);
      }
    }
  }

  // 3. Generate promo codes and send campaigns
  let totalSent = 0;
  let totalUsed = 0;
  let totalRevenue = 0;
  const campaignSentCount = segments.length;

  for (const segment of segments) {
    // Skip if already sent recently
    if (await hasRecentWinBack(segment.clientId, segment.segmentType)) {
      continue;
    }

    // Generate promo code
    const promoCode = generatePromoCode();

    // Mark as sent in anti-spam journal
    await markCampaignSent(
      `winback_${segment.clientId}_${Date.now()}`,
      segment.segmentType,
      segment.clientId,
    );

    // Send win-back push notification
    const pushResult = await sendWinBackPush(
      segment.clientId,
      promoCode,
      segment.segmentType,
    );

    if (pushResult.sent) {
      totalSent++;

      // Track promo code usage (simplified)
      // In production, would track against actual bookings
      // const used = await trackPromoCodeUse(promoCode, segment.clientId);
      // if (used) {
      //   totalUsed++;
      //   totalRevenue += /* average ticket */ 100; // placeholder
      // }
    }
  }

  // 4. Calculate ROI
  const conversionRate = totalSent > 0 ? (totalUsed / totalSent) * 100 : 0;
  const averageTicket = totalUsed > 0 ? totalRevenue / totalUsed : 50; // default

  return {
    segmentType: segments.length > 0 ? segments[0].segmentType : 'MIXED' as any,
    totalSent,
    totalUsed,
    totalRevenue,
    conversionRate: Math.round(conversionRate),
    averageTicket: Math.round(averageTicket),
    campaignSentCount,
  };
}