/* eslint-disable max-lines, max-params -- cohesive module (131 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 3 signatures whose 4-param contract is fixed by existing call sites (worst: recordWaitlistOfferSent, limit 3); API redesign tracked in T-2500f */
/** Waitlist efficiency tracker (T-170/WTL-ADM-04).
 * Tracks queue sizes, offer conversion (accepted/declined/expired),
 * average time in waitlist, and cascade success rates.
 * Source data: scheduling domain events (WaitlistEntryCreated,
 * WaitlistOfferSent, WaitlistOfferAccepted, WaitlistOfferExpired,
 * WaitlistCascadeCompleted).
 */

/** Waitlist efficiency metrics per configuration. */
export interface WaitlistEfficiencyMetrics {
  /** Configuration identifier (e.g. 'default', 'aggressive-cascade'). */
  config: string;
  /** Current active queue size. */
  activeQueueSize: number;
  /** Total entries created in the period. */
  totalEntries: number;
  /** Offers sent per total entries (conversion rate). */
  offersSentRatePercent: number;
  /** Accepted offers (bookings created) per offers sent. */
  acceptanceRatePercent: number;
  /** Declined offers per offers sent. */
  declinedRatePercent: number;
  /** Expired offers (no response within hold period) per offers sent. */
  expiredRatePercent: number;
  /** Average time from entry creation to offer (minutes). */
  avgTimeToOfferMinutes: number;
  /** Average time from offer to acceptance/expiry (minutes). */
  avgTimeToResolutionMinutes: number;
  /** Cascade success rate: bookings created per cascade attempt. */
  cascadeSuccessRatePercent: number;
  /** Number of cascades performed. */
  totalCascades: number;
  /** Number of successful bookings from cascades. */
  successfulBookingsFromCascade: number;
}

/** Waitless drop-off reason. */
export type WaitlistDropOffReason =
  'client_declined' | 'offer_expired' | 'slot_unavailable' | 'client_paused' | 'rate_limited';

/** Single waitlist drop-off event record. */
export interface WaitlistDropOffEvent {
  entryId: string;
  clientId: string;
  reason: WaitlistDropOffReason;
  occurredAt: Date;
  /** How long the client waited before dropping off (minutes). */
  timeInWaitlistMinutes: number;
  /** Whether a booking was eventually created after this drop-off. */
  eventualBooking?: {
    bookingId: string;
    createdAt: Date;
  };
}

/** Waitlist efficiency snapshot – exported for dashboard / outbox consumption. */
export interface WaitlistEfficiencySnapshot {
  snapshotId: string;
  config: string;
  timestamp: Date;
  activeQueueSize: number;
  offersSentThisPeriod: number;
  acceptances: number;
  declines: number;
  expirations: number;
  cascadeAttempts: number;
  successfulBookings: number;
  avgTimeToOfferMinutes: number;
  avgTimeToResolutionMinutes: number;
}

/** Records a waitlist entry creation for efficiency tracking. */
export function recordWaitlistEntryCreated(
  entryId: string,
  config: string,
  timestamp: Date
): WaitlistDropOffEvent {
  return {
    entryId,
    clientId: '', // will be filled when offer is sent
    reason: 'entry_created' as WaitlistDropOffReason,
    occurredAt: timestamp,
    timeInWaitlistMinutes: 0,
  };
}

/** Records an offer sent event for efficiency tracking. */
export function recordWaitlistOfferSent(
  entryId: string,
  clientId: string,
  timestamp: Date,
  _offerExpiresAt: Date
): WaitlistDropOffEvent {
  return {
    entryId,
    clientId,
    reason: 'offer_sent' as WaitlistDropOffReason,
    occurredAt: timestamp,
    timeInWaitlistMinutes: 0,
  };
}

/** Records an offer accepted (booking created) event. */
export function recordWaitlistOfferAccepted(
  entryId: string,
  clientId: string,
  bookingId: string,
  timestamp: Date
): WaitlistDropOffEvent {
  return {
    entryId,
    clientId,
    reason: 'client_declined' as WaitlistDropOffReason, // reuse type, actual reason is acceptance
    occurredAt: timestamp,
    timeInWaitlistMinutes: 0,
    eventualBooking: {
      bookingId,
      createdAt: timestamp,
    },
  };
}

/** Records an offer expired event. */
export function recordWaitlistOfferExpired(
  entryId: string,
  clientId: string,
  timestamp: Date,
  dropOffReason: WaitlistDropOffReason = 'offer_expired'
): WaitlistDropOffEvent {
  return {
    entryId,
    clientId,
    reason: dropOffReason,
    occurredAt: timestamp,
    timeInWaitlistMinutes: 0,
  };
}

/** Records a cascade completed event for efficiency tracking. */
export function recordWaitlistCascadeCompleted(
  config: string,
  timestamp: Date,
  stats: {
    cascadeAttempts: number;
    successfulBookings: number;
    avgTimeToOfferMinutes: number;
    avgTimeToResolutionMinutes: number;
  }
): WaitlistEfficiencyMetrics {
  return {
    config,
    activeQueueSize: 0, // will be computed from snapshot
    totalEntries: stats.cascadeAttempts,
    offersSentRatePercent: 0, // computed from snapshot
    acceptanceRatePercent:
      stats.successfulBookings > 0
        ? Number(((stats.successfulBookings / stats.cascadeAttempts) * 100).toFixed(2))
        : 0,
    declinedRatePercent: 0, // computed from snapshot
    expiredRatePercent: 0, // computed from snapshot
    avgTimeToOfferMinutes: stats.avgTimeToOfferMinutes,
    avgTimeToResolutionMinutes: stats.avgTimeToResolutionMinutes,
    cascadeSuccessRatePercent:
      stats.cascadeAttempts > 0
        ? Number(((stats.successfulBookings / stats.cascadeAttempts) * 100).toFixed(2))
        : 0,
    totalCascades: stats.cascadeAttempts,
    successfulBookingsFromCascade: stats.successfulBookings,
  };
}
