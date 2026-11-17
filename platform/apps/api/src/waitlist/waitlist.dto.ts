import { Type, IsOptional } from '@nestjs/common';
import { IdempotencyKey } from '../../shared/decorators/idempotency-key.decorator';

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

// Active waitlist output DTO
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

// Waitlist output
export class WaitlistOutput {
  success: boolean;
  data: {
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
    // hold info (if holding a slot)
    holdId?: string;
    holdExpiry?: Date;
    heldBy?: string;
    // offer info (if offering to next client)
    nextOffer?: {
      offerId: string;
      slotId: string;
      locationId: string;
      barberId: string;
      serviceId: string;
      agreedPrice: number;
      holdExpiry: Date;
      offerExpiry: Date;
      source: string;
      message: string;
    };
    newBooking?: {
      id: string;
      clientId: string;
      barberId: string;
      serviceId: string;
      status: string;
      start: string;
      end: string;
      source: string;
    };
  };
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
  source: string; // ReleaseSource.APPOINTMENT_CANCELLED | APPOINTMENT_NO_SHOW | ADMIN_RELEASED
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
  source: string; // ReleaseSource enum value
}