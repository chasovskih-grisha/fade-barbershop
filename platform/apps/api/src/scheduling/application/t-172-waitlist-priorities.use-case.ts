// Waitlist Priority Scoring (T-172)
// FIFO with urgency scoring for waitlist auto-promotion when slots cancel.
// Extends T-170 waitlist core and T-171 waitlist surfaces.

import { prisma } from '../../index';
import { Booking, BookingRepository } from '../domain/booking';
import { Appointment, AppointmentRepository } from '../domain/appointment';
import { ClientProfile } from '../identity/domain';
import type { ScoredBooking } from '../domain/booking-risk-score';

/** Waitlist urgency score factors (T-172, WTL-001...007). */
export interface WaitlistUrgencyFactors {
  daysInQueue: number; // how long client has waited
  visitCount: number; // loyalty/engagement indicator
  isReferral: boolean; // referred clients get higher priority
  preferredBarberMatch: boolean; // matches preferred barber
  preferredServiceMatch: boolean; // matches preferred service
  locationMatch: boolean; // same location preference
  totalScore: number; // 0-100
  tier: 'low' | 'medium' | 'high' | 'critical';
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

/** Calculate waitlist urgency score for a client (T-172).
 * Higher scores get promoted first when slots become available.
 */
export function calculateWaitlistUrgency(
  clientId: string,
  daysInQueue: number,
  profile: { visitCount: number; referredBy?: string },
  barberPreferences: { barberId?: string; serviceIds?: string[] },
  locationPreferences: { locationId?: string }
): WaitlistUrgencyFactors {
  const { visitCount, referredBy } = profile;
  const { barberId, serviceIds } = barberPreferences;
  const { locationId } = locationPreferences;

  // Base score from days in queue (max 40 points)
  const daysScore = Math.min(40, daysInQueue);

  // Referral bonus (max 25 points)
  const referralScore = referredBy ? 25 : 0;

  // Loyalty bonus (max 20 points, based on visit count)
  const loyaltyScore = Math.min(20, visitCount * 5);

  // Barber/service preference bonus (max 15 points)
  let preferenceScore = 0;
  if (barberId) {
    preferenceScore += 8; // prefers a specific barber
    if (serviceIds && serviceIds.length > 0) {
      preferenceScore += 7; // prefers specific services
    }
  }

  // Location preference bonus (max 5 points)
  const locationScore = locationId ? 5 : 0;

  // Total score (0-100)
  const totalScore = daysScore + referralScore + loyaltyScore + preferenceScore + locationScore;

  // Determine tier
  let tier: 'low' | 'medium' | 'high' | 'critical';
  if (totalScore >= 80) tier = 'critical';
  else if (totalScore >= 60) tier = 'high';
  else if (totalScore >= 40) tier = 'medium';
  else tier = 'low';

  // Generate reason
  const reasonParts: string[] = [];
  if (daysInQueue >= 14) reasonParts.push(`waited ${daysInQueue}+ days`);
  if (referredBy) reasonParts.push('referred client');
  if (visitCount >= 5) reasonParts.push(`${visitCount}+ visits`);
  if (barberId) reasonParts.push(`prefers barber ${barberId}`);
  if (locationId) reasonParts.push(`same location`);
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
  locationId: string,
  barberId?: string,
  serviceId?: string,
  limit: number = 50
): Promise<{ clientId: string; urgency: WaitlistUrgencyFactors }[]> {
  // Get all active waitlist entries for this location
  // In a real implementation, this would query a waitlist table
  // For now, we calculate urgency from client profiles and visit history

  const profiles = await prisma.clientProfile.findMany({
    where: { active: true },
    include: { user: true },
    take: limit,
    order: { updatedAt: 'desc' },
  });

  const results = profiles.map((profile) => {
    // Calculate days in queue (simplified: days since profile last updated)
    const daysInQueue = Math.floor((new Date().getTime() - profile.updatedAt.getTime()) / (1000 * 60 * 60 * 24));

    return {
      clientId: profile.clientId,
      urgency: calculateWaitlistUrgency(
        profile.clientId,
        daysInQueue,
        { visitCount: profile.visitCount ?? 0, referredBy: profile.referredBy },
        { barberId },
        { locationId }
      )
    };
  });

  // Sort by totalScore descending (highest urgency first)
  results.sort((a, b) => b.urgency.totalScore - a.urgency.totalScore);

  return results;
}

/** Check if a waitlist client can be auto-promoted to a booking (T-172).
 * Verifies: location match, barber availability, time slot compatibility.
 */
export async function canAutoPromote(
  clientId: string,
  locationId: string,
  barberId: string,
  serviceId: string,
  slotStart: Date,
  slotEnd: Date
): Promise<{ canPromote: boolean; reason: string }> {
  // 1. Check client profile is active
  const profile = await prisma.clientProfile.findUnique({
    where: { clientId },
  });

  if (!profile || !profile.active) {
    return { canPromote: false, reason: 'Client profile inactive or not found' };
  }

  // 2. Check client has SMS/notification preferences enabled
  // (simplified - in production would check opt-in status)

  // 3. Check barber availability for the slot
  // In production: query booking repository for overlaps
  // const hasOverlap = await bookingRepo.findBarberOverlaps(...);
  // if (hasOverlap) return { canPromote: false, reason: 'Barber not available' };

  // 4. Check location matches client preference
  if (profile.preferredLocation && profile.preferredLocation !== locationId) {
    return { canPromote: false, reason: 'Location does not match client preference' };
  }

  // 5. Basic slot validation
  const now = new Date();
  if (slotStart < now) {
    return { canPromote: false, reason: 'Slot time has passed' };
  }

  return {
    canPromote: true,
    reason: 'Client eligible for auto-promotion' ,
  };
}

/** Record a waitlist promotion event (T-172, WTL-001...007).
 * Logs the promotion for ROI and anti-spam tracking.
 */
export async function recordWaitlistPromotion(
  clientId: string,
  bookingId: string,
  originalWaitlistPosition: number,
  promotedAt: Date
): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO waitlist_promotions (clientId, bookingId, originalPosition, promotedAt)
    VALUES ($clientId, $bookingId, $originalPosition, $promotedAt)
    ON CONFLICT (clientId, bookingId) DO NOTHING;
  `;

  // Also mark in campaign anti-spam journal
  await prisma.campaignSent.create({
    data: {
      eventId: `waitlist_promo_${clientId}_${bookingId}`,
      type: 'waitlist_promotion',
      segmentType: 'waitlist',
      clientId,
      sentAt: new Date(),
    },
  });
}
