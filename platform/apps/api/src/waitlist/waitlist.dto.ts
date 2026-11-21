/* eslint-disable max-lines -- cohesive module (143 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
import { IdempotencyKey } from '../shared/decorators/idempotency-key.decorator';
import { ReleaseSource } from './waitlist.domain';

// Waitlist entry creation input
export class CreateWaitlistEntryInput {
  @IdempotencyKey()
  slotId: string;
  clientId: string;
  locationId: string;
  barberId: string;
  serviceId: string;
  agreedPrice: number;
}

// Hold slot input
export class HoldSlotInput {
  @IdempotencyKey()
  slotId: string;
  clientId: string;
  locationId: string;
}

// Active waitlist entry DTO
export class WaitlistEntryOutput {
  id: string;
  slotId: string;
  clientId: string;
  locationId: string;
  barberId: string;
  serviceId: string;
  agreedPrice: number;
  holdExpiry: Date;
  status: string;
  createdAt: Date;
  missedCount: number;
}

/** Offer sent to the next client on the waitlist. */
export interface WaitlistOfferData {
  offerId: string;
  slotId: string;
  locationId: string;
  barberId: string;
  serviceId: string;
  agreedPrice: number;
  holdExpiry: Date;
  offerExpiry: Date;
  source: ReleaseSource;
  message: string;
}

/** Booking created when a waitlist offer is accepted. */
export interface WaitlistBookingData {
  id: string;
  clientId: string | null;
  barberId: string;
  serviceId: string | null;
  status: string;
  start?: string;
  end?: string;
  source: string;
}

/** Result of holding a slot for a client (not a booking). */
export interface WaitlistHoldData {
  holdId: string;
  slotId: string;
  locationId: string;
  holdExpiry: Date;
  heldBy?: string | undefined;
  status: string;
}

/** Result of releasing a hold and cascading to the next client. */
export interface WaitlistReleaseData {
  holdId: string;
  nextOffer: WaitlistOfferData | null;
  newBooking: WaitlistBookingData | null;
}

/** Result of checking whether a client may join the waitlist. */
export interface WaitlistJoinCheckData {
  canJoin: boolean;
  reason?: string | undefined;
}

/** Result of a waitlist cascade run. */
export interface WaitlistCascadeData {
  offersSent: number;
  bookingsCreated: number;
  errors: string[];
}

/** Payload carried by the generic waitlist response envelope. */
export type WaitlistData =
  | WaitlistEntryOutput
  | WaitlistHoldData
  | WaitlistReleaseData
  | WaitlistJoinCheckData
  | WaitlistCascadeData;

// Waitlist output
export class WaitlistOutput {
  success: boolean;
  data: WaitlistData;
}

// Active waitlist output DTO
export class ActiveWaitlistOutput {
  success: boolean;
  data: {
    totalCount: number;
    nextEntry: {
      id: string;
      clientId: string;
      locationId: string;
      barberId: string;
      serviceId: string;
      agreedPrice: number;
      holdExpiry: Date;
      status: string;
      createdAt: Date;
      missedCount: number;
      remainingHoldSeconds?: number;
    } | null;
    entries: {
      id: string;
      clientId: string;
      locationId: string;
      barberId: string;
      serviceId: string;
      agreedPrice: number;
      holdExpiry: Date;
      status: string;
      createdAt: Date;
      missedCount: number;
    }[];
  };
}

// Client waitlist history output DTO
export class ClientWaitlistHistoryOutput {
  success: boolean;
  data: {
    clientId: string;
    noShowsOnWaitlist: number;
    missesOnWaitlist: number;
    isPaused: boolean;
    pauseUntil?: Date;
    canJoin: boolean;
    reason?: string;
  };
}

// Cancel waitlist entry input
export class CancelWaitlistInput {
  @IdempotencyKey()
  holdId: string;
  source: ReleaseSource;
  releasedBy: string;
}

// Check join input
export class CheckJoinInput {
  @IdempotencyKey()
  clientId: string;
}

// Cascade waitlist input
export class CascadeWaitlistInput {
  @IdempotencyKey()
  slotId: string;
  locationId: string;
  source: ReleaseSource;
}
